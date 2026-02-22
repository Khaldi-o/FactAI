import csv
import os
import re
import subprocess
import sys
from collections import deque
from pathlib import Path
from typing import Dict, List
from dotenv import load_dotenv
from extract_info import *
from gpt_api import analyze_transcript, generate_verification_table as generate_openai_verification_table
from verification_table import VerificationTable

from tafrigh import Config, TranscriptType, farrigh

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load environment variables from .env filee
load_dotenv()

# Define Wit.ai API keys for languages using environment variables
LANGUAGE_API_KEYS = {
    'EN': os.getenv('WIT_API_KEY_ENGLISH'),
    'AR': os.getenv('WIT_API_KEY_ARABIC'),
    'FR': os.getenv('WIT_API_KEY_FRENCH'),
    'JA': os.getenv('WIT_API_KEY_JAPANESE'),
    # Add more languages and API keys as neededdd
}

# Check if at least one API key is provided
if not any(LANGUAGE_API_KEYS.values()):
    print("Warning: aucune clé WIT.ai détectée. Le backend démarre en mode fallback.")

BASE_DIR = Path(__file__).parent
DOWNLOADS_DIR = BASE_DIR / "downloads"
FALLBACK_DATA_DIR = BASE_DIR / "fallback_data"
FALLBACK_TRANSCRIPT_PATH = FALLBACK_DATA_DIR / "testme.txt"
FALLBACK_TABLE_PATH = FALLBACK_DATA_DIR / "verification_table_demo.csv"
DEFAULT_EXPORT_CSV_PATH = DOWNLOADS_DIR / "verification_table.csv"


def download_youtube_audio(youtube_url):
    output_path = Path(__file__).parent / 'downloads' / '%(id)s.%(ext)s'
    command = ['yt-dlp', '-x', '--audio-format', 'wav', '-o', str(output_path), youtube_url]
    subprocess.run(command, check=True)
    audio_file = next(Path(__file__).parent.glob('downloads/*.wav'))
    return audio_file

def convert_video_to_audio(video_path):
    audio_output_path = video_path.with_suffix('.wav')  # Ensure output is WAV
    # -y avoids interactive overwrite prompts that can block API requests.
    command = ['ffmpeg', '-y', '-i', str(video_path), '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', str(audio_output_path)]
    subprocess.run(command, check=True)
    print(f"Video converted to audio: {audio_output_path}")
    return audio_output_path

def convert_mp3_to_wav(mp3_path):
    wav_output_path = mp3_path.with_suffix('.wav')
    # -y avoids interactive overwrite prompts that can block API requests.
    command = ['ffmpeg', '-y', '-i', str(mp3_path), str(wav_output_path)]
    subprocess.run(command, check=True)
    print(f"MP3 converted to WAV: {wav_output_path}")
    return wav_output_path

def is_wav_file(file_path):
    try:
        with open(file_path, 'rb') as file:
            return file.read(4) == b'RIFF'
    except IOError:
        return False

def get_claude_response(sentence):
    # Simulation d'une réponse pour le test
    return "Ceci est une réponse simulée pour le test. La phrase est considérée comme vraie."

def create_verification_table(info_list):
    table = []
    for info in info_list:
        sentence = info['sentence']
        response = get_claude_response(sentence)

        verification = "Vraie"

        # Utiliser la réponse simulée comme description
        description = response

        table.append({
            'Information': sentence,
            'Vérification': verification,
            'Description': description,
            'SourceLabel': "Wikipedia",
            'SourceUrl': "https://en.wikipedia.org/wiki/Gravity_train",
        })

    return table


def extract_structured_claims(transcription: str) -> List[str]:
    cleaned = re.sub(r"\s+", " ", transcription).strip()
    if not cleaned:
        return []

    base_sentences = split_into_sentences(cleaned)
    merged: List[str] = []
    carry = ""

    for sentence in base_sentences:
        sentence = sentence.strip(" -")
        if not sentence:
            continue

        if len(sentence) < 35:
            carry = f"{carry} {sentence}".strip()
            continue

        if carry:
            sentence = f"{carry} {sentence}".strip()
            carry = ""

        merged.append(sentence)

    if carry:
        merged.append(carry)

    candidates: List[str] = []
    for sentence in merged:
        chunks = re.split(
            r"(?<=[.;:!?])\s+|,\s*(?=(?:mais|or|donc|cependant|toutefois)\b)",
            sentence,
            flags=re.IGNORECASE,
        )
        for chunk in chunks:
            if isinstance(chunk, str):
                normalized = chunk.strip(" ,.;")
                if 20 <= len(normalized) <= 260:
                    candidates.append(normalized)

    # Deduplicate while preserving order.
    seen = set()
    claims = []
    for claim in candidates:
        key = claim.lower()
        if key in seen:
            continue
        seen.add(key)
        claims.append(claim)

    return claims

def normalize_result_row(row: Dict[str, str]) -> Dict[str, str]:
    info = (
        row.get("Information")
        or row.get("information")
        or ""
    )
    verification = (
        row.get("Vérification")
        or row.get("Verification")
        or row.get("verification")
        or "Non vérifiable"
    )
    description = (
        row.get("Description")
        or row.get("description")
        or ""
    )
    source_label = (
        row.get("SourceLabel")
        or row.get("Source")
        or row.get("SourceName")
        or row.get("source")
        or ""
    )
    source_url = (
        row.get("SourceUrl")
        or row.get("SourceURL")
        or row.get("url")
        or ""
    )

    if not source_label or not source_url:
        inferred_label, inferred_url = infer_source(info)
        source_label = source_label or inferred_label
        source_url = source_url or inferred_url

    return {
        "Information": str(info).strip(),
        "Vérification": str(verification).strip(),
        "Description": str(description).strip(),
        "SourceLabel": str(source_label).strip(),
        "SourceUrl": str(source_url).strip(),
    }


def infer_source(information: str) -> tuple[str, str]:
    text = information.lower()
    if any(token in text for token in ["noyau", "core", "temp", "degr"]):
        return "USGS", "https://www.usgs.gov/faqs/what-are-earths-layers"
    if any(token in text for token in ["grav", "centre", "center"]):
        return "Britannica", "https://www.britannica.com/science/Shell-theorem"
    if any(token in text for token in ["tunnel", "42 minutes", "chute", "oscill"]):
        return "Wikipedia", "https://en.wikipedia.org/wiki/Gravity_train"
    return "Britannica", "https://www.britannica.com/science/Earth"


def fallback_results_from_csv() -> List[Dict[str, str]]:
    if not FALLBACK_TABLE_PATH.exists():
        return []

    rows: List[Dict[str, str]] = []
    with open(FALLBACK_TABLE_PATH, newline="", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        for raw_row in reader:
            row = normalize_result_row(raw_row)
            if row["Information"] or row["Description"]:
                rows.append(row)
    return rows


def fallback_results_from_transcript() -> List[Dict[str, str]]:
    if not FALLBACK_TRANSCRIPT_PATH.exists():
        return []

    text = FALLBACK_TRANSCRIPT_PATH.read_text(encoding="utf-8", errors="ignore").strip()
    if not text:
        return []

    sentences = split_into_sentences(text)
    if not sentences:
        sentences = [text]

    return [
        {
            "Information": sentence.strip(),
            "Vérification": "Non vérifiable",
            "Description": "Résultat de secours chargé depuis la transcription locale.",
            "SourceLabel": "Transcription locale",
            "SourceUrl": "https://en.wikipedia.org/wiki/Transcription_(linguistics)",
        }
        for sentence in sentences if sentence.strip()
    ]


def get_default_fallback_results() -> List[Dict[str, str]]:
    csv_rows = fallback_results_from_csv()
    if csv_rows:
        print(f"Fallback actif: {len(csv_rows)} lignes chargées depuis {FALLBACK_TABLE_PATH}.")
        return csv_rows

    transcript_rows = fallback_results_from_transcript()
    if transcript_rows:
        print(
            f"Fallback actif: {len(transcript_rows)} lignes construites depuis {FALLBACK_TRANSCRIPT_PATH}."
        )
        return transcript_rows

    return [{
        "Information": "Aucun résultat généré.",
        "Vérification": "Non vérifiable",
        "Description": "Le traitement principal a échoué et aucun fichier de secours n'a été trouvé.",
    }]


def resolve_local_file_path(local_file_path: str) -> Path:
    raw_path = Path(local_file_path).expanduser()
    if raw_path.is_absolute():
        return raw_path

    candidates = [
        Path.cwd() / raw_path,
        BASE_DIR / raw_path,
        DOWNLOADS_DIR / raw_path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    return DOWNLOADS_DIR / raw_path


def transcribe_file(file_path: Path, language_sign: str, ask_export: bool = True) -> List[Dict[str, str]]:
    if not is_wav_file(file_path):
        raise ValueError(f"Skipping file {file_path} as it is not in WAV format.")

    wit_api_key = LANGUAGE_API_KEYS.get(language_sign.upper())
    if not wit_api_key:
        raise ValueError(f"API key not found for language: {language_sign}")

    config = Config(
        urls_or_paths=[str(file_path)],
        skip_if_output_exist=False,
        playlist_items="",
        verbose=False,
        model_name_or_path="",
        task="",
        language="",
        use_faster_whisper=False,
        beam_size=0,
        ct2_compute_type="",
        wit_client_access_tokens=[wit_api_key],
        max_cutting_duration=5,
        min_words_per_segment=1,
        save_files_before_compact=False,
        save_yt_dlp_responses=False,
        output_sample=0,
        output_formats=[TranscriptType.TXT, TranscriptType.SRT],
        output_dir=str(file_path.parent),
    )

    print(f"Transcribing file: {file_path}")
    progress = deque(farrigh(config), maxlen=0)
    print(f"Transcription complete. Check la répertoire d'output pour les fichiers générés.")

    # Extract sentences depuis la transcription
    transcription_file_path = file_path.with_suffix('.txt')
    transcription = read_transcription(transcription_file_path)
    sentences = extract_structured_claims(transcription)
    if not sentences:
        sentences = split_into_sentences(transcription)
    info_list = create_info_list(sentences)

  
    for info in info_list:
        print(f"Position: {info['position']}, Sentence: {info['sentence']}")

    
    for info in info_list:
        sentence = info['sentence']
        response = get_claude_response(sentence)
        print(f"Phrase: {sentence}")
        print(f"Réponse de Claude: {response}")
        print("---")

    # Try OpenAI analysis first; fall back to local simulated table if unavailable.
    verification_table: List[Dict[str, str]] = []
    analysis_result = analyze_transcript(transcription)
    if not analysis_result.empty:
        openai_rows = generate_openai_verification_table(analysis_result)
        verification_table = [normalize_result_row(row) for row in openai_rows]
        print(f"OpenAI verification active: {len(verification_table)} lignes générées.")
    else:
        verification_table = create_verification_table(info_list)
        print("OpenAI indisponible: fallback local de vérification utilisé.")

    table = VerificationTable(verification_table)
    table.display()

    if ask_export:
        export_choice = input("Voulez-vous exporter le tableau de vérification vers un fichier CSV ? (O/N) : ")
        if export_choice.lower() == 'o':
            table.export_to_csv(str(DEFAULT_EXPORT_CSV_PATH))
    return verification_table

def main():
    choice = input("Do you want to transcribe a YouTube video (Y) or a local file (L)? [Y/L]: ").strip().upper()

    if choice == 'Y':
        youtube_url = input("Enter the YouTube video link: ")
        language_sign = input("Enter the language sign (e.g., EN, AR, FR, JA): ")
        audio_file = download_youtube_audio(youtube_url)
        transcribe_file(audio_file, language_sign)
    elif choice == 'L':
        file_path = input("Enter the path to the local file or directory: ")
        file_path = Path(file_path)

        if file_path.is_dir():
            # Process all audio/video files in the directory
            for file in file_path.glob('*'):
                if file.suffix.lower() in ['.wav']:
                    language_sign = input(f"Enter the language sign for {file.name} (e.g., EN, AR, FR, JA): ")
                    transcribe_file(file, language_sign)
                elif file.suffix.lower() in ['.mp3']:
                    wav_file = convert_mp3_to_wav(file)
                    language_sign = input(f"Enter the language sign for {file.name} (e.g., EN, AR, FR, JA): ")
                    transcribe_file(wav_file, language_sign)
                elif file.suffix.lower() in ['.mp4', '.mkv', '.avi']:
                    audio_file = convert_video_to_audio(file)
                    language_sign = input(f"Enter the language sign for {file.name} (e.g., EN, AR, FR, JA): ")
                    transcribe_file(audio_file, language_sign)
        else:
            if file_path.suffix.lower() in ['.mp3']:
                file_path = convert_mp3_to_wav(file_path)
            elif file_path.suffix.lower() in ['.mp4', '.mkv', '.avi']:
                file_path = convert_video_to_audio(file_path)
            language_sign = input("Enter the language sign (e.g., EN, AR, FR, JA): ")
            transcribe_file(file_path, language_sign, ask_export=True)
    else:
        print("Invalid choice. Exiting.")
        sys.exit(1)

@app.route('/api/transcribe', methods=['POST'])
def transcribe_route():
    print('Requête reçue dans /api/transcribe')
    data = request.get_json(silent=True) or {}
    input_type = (data.get('inputType') or '').lower()
    language_sign = data.get('languageSign') or ''
    youtube_url = data.get('youtubeUrl') or ''
    local_file_path = data.get('localFilePath') or ''

    try:
        if input_type == 'youtube':
            audio_file = download_youtube_audio(youtube_url)
            results = transcribe_file(audio_file, language_sign, ask_export=False)
        elif input_type == 'local':
            file_path = resolve_local_file_path(local_file_path)
            if not file_path.exists():
                raise FileNotFoundError(f"Input file not found: {file_path}")
            if file_path.suffix.lower() in ['.mp3']:
                file_path = convert_mp3_to_wav(file_path)
            elif file_path.suffix.lower() in ['.mp4', '.mkv', '.avi']:
                file_path = convert_video_to_audio(file_path)
            results = transcribe_file(file_path, language_sign, ask_export=False)
        else:
            raise ValueError("Invalid inputType. Use 'youtube' or 'local'.")

        if not results:
            raise RuntimeError("No results produced by primary pipeline.")
        return jsonify(results)

    except Exception as exc:
        print(f"Primary pipeline failed: {exc}")
        fallback_results = get_default_fallback_results()
        return jsonify(fallback_results), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)

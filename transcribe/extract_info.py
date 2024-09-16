import nltk
nltk.download('punkt')

# extract_info.py

def read_transcription(file_path):
    with open(file_path, 'r') as file:
        transcription = file.read()
    return transcription

# extract_info.py


def split_into_sentences(text):
    sentences = nltk.sent_tokenize(text)
    return sentences


def create_info_list(sentences):
    info_list = [{'sentence': sentence, 'position': index} for index, sentence in enumerate(sentences)]
    return info_list
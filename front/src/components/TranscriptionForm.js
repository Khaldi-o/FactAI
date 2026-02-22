import React, { useEffect, useState } from "react";
import "./TranscriptionForm.css";

const LOADING_MESSAGES = [
  "Transcription en cours...",
  "Analyse des informations...",
  "Génération du tableau de vérification...",
];

const TranscriptionForm = ({ onTranscriptionComplete }) => {
  const [inputType, setInputType] = useState("");
  const [languageSign, setLanguageSign] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [localFilePath, setLocalFilePath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return undefined;
    }

    const intervalId = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 4500);

    return () => clearInterval(intervalId);
  }, [isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!inputType) {
      setErrorMessage("Choisis une source: vidéo YouTube ou fichier local.");
      return;
    }

    if (!languageSign.trim()) {
      setErrorMessage("La langue est obligatoire (ex: FR, EN).");
      return;
    }

    if (inputType === "youtube" && !youtubeUrl.trim()) {
      setErrorMessage("Le lien YouTube est obligatoire.");
      return;
    }

    if (inputType === "local" && !localFilePath.trim()) {
      setErrorMessage("Le chemin du fichier local est obligatoire.");
      return;
    }

    setIsLoading(true);

    const formData = {
      inputType,
      languageSign: languageSign.trim(),
      youtubeUrl: inputType === "youtube" ? youtubeUrl : "",
      localFilePath: inputType === "local" ? localFilePath.trim() : "",
    };

    console.log("Données du formulaire :", formData);

    try {
      const response = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const backendError = await response.text();
        throw new Error(backendError || "Erreur backend pendant la transcription.");
      }

      const results = await response.json();
      onTranscriptionComplete(results);
    } catch (error) {
      console.error("Erreur lors de la requête de transcription", error);
      setErrorMessage(
        "La génération des résultats a échoué. Vérifie le backend puis réessaie."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="transcription-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>
          <input
            type="radio"
            value="youtube"
            checked={inputType === "youtube"}
            onChange={(e) => setInputType(e.target.value)}
          />
          Vidéo YouTube
        </label>
        <label>
          <input
            type="radio"
            value="local"
            checked={inputType === "local"}
            onChange={(e) => setInputType(e.target.value)}
          />
          Fichier local
        </label>
      </div>
      {inputType === "youtube" && (
        <div className="form-group">
          <label>
            Lien de la vidéo YouTube :
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>
        </div>
      )}
      {inputType === "local" && (
        <div className="form-group">
          <label>
            Chemin du fichier local :
            <input
              type="text"
              value={localFilePath}
              onChange={(e) => setLocalFilePath(e.target.value)}
              placeholder="/path/vers/file/testme.mp3"
            />
          </label>
        </div>
      )}
      <div className="form-group1">
        <label>
          Langue :
          <input
            type="text"
            value={languageSign}
            onChange={(e) => setLanguageSign(e.target.value)}
            placeholder="EN, AR, FR, JA, etc."
          />
        </label>
      </div>
      <button type="submit" disabled={isLoading}>
        Envoyer
      </button>

      {isLoading && (
        <div className="processing-card" role="status" aria-live="polite">
          <div className="processing-spinner" />
          <div>
            <p className="processing-title">{LOADING_MESSAGES[loadingStep]}</p>
            <p className="processing-subtitle">
              Le traitement peut prendre quelques secondes selon la taille du média.
            </p>
          </div>
        </div>
      )}

      {errorMessage && <p className="form-error">{errorMessage}</p>}
    </form>
  );
};

export default TranscriptionForm;

import React, { useState } from "react";
import "./TranscriptionForm.css";

const TranscriptionForm = ({ onTranscriptionComplete }) => {
  const [inputType, setInputType] = useState("");
  const [languageSign, setLanguageSign] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [localFilePath, setLocalFilePath] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = {
      inputType,
      languageSign,
      youtubeUrl: inputType === "youtube" ? youtubeUrl : "",
      localFilePath: inputType === "local" ? localFilePath : "",
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

      if (response.ok) {
        const results = await response.json();
        onTranscriptionComplete(results); // Appeler la fonction avec les résultats
      } else {
        console.error("Erreur lors de la transcription");
      }
    } catch (error) {
      console.error("Erreur lors de la requête de transcription", error);
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
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
        {isLoading ? "Envoi en cours..." : "Envoyer"}
      </button>
    </form>
  );
};

export default TranscriptionForm;

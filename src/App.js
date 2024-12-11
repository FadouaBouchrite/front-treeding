import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import "chart.js/auto";

const App = () => {


   // Fonction pour entraîner le modèle
const fetchTrainModel = async () => {
  try {
    const response = await axios.get("http://127.0.0.1:5001/train-model");
    console.log("Modèle entraîné :", response.data);
  } catch (error) {
    console.error("Erreur lors de l'entraînement du modèle :", error);
  }
};
useEffect(() => {

  const trainModelInterval = setInterval(fetchTrainModel, 1800000); // 60 secondes pour entraîner le modèle
  fetchTrainModel(); // Entraîner le modèle dès le chargement

  return () => {
    
    clearInterval(trainModelInterval);
  };
}, []);
const [recommendations, setRecommendations] = useState(null);

const fetchRecommendations = async () => {
  try {
    const response = await axios.post("http://127.0.0.1:5001/feedback");
    setRecommendations(response.data);
  } catch (error) {
    console.error("Erreur lors de la récupération des recommandations :", error);
  }
};

useEffect(() => {

  const recommandationsList = setInterval(fetchRecommendations, 60000); // 60 secondes pour les données réelles

  // Charger les recommandations dès le début

  return () => {
    clearInterval(recommandationsList);
   
  };
}, []);

  // État pour les données du graphique
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Prochaine valeur prédite",
        data: [],
        borderColor: "rgba(255, 0, 0, 1)",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        borderDash: [5, 5],
        fill: false,
      },
      {
        label: "Prix de l'action Apple (Close)",
        data: [],
        borderColor: "rgba(0, 255, 0, 1)",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        fill: true,
      },
    ],
  });

  // État pour les indicateurs
  const [indicators, setIndicators] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Nombre d'indicateurs par page

  // Fonction pour récupérer la prédiction
  const fetchPrediction = async () => {
    try {
      const currentTime = new Date().toLocaleTimeString();
      const predictionResponse = await axios.get("http://127.0.0.1:5001/predict-next-minute");
      const predictionData = predictionResponse.data;

      if (predictionData && predictionData.predicted_close) {
        setChartData((prevData) => ({
          labels: [...prevData.labels, currentTime],
          datasets: [
            {
              ...prevData.datasets[0],
              data: [...prevData.datasets[0].data, predictionData.predicted_close],
            },
            { ...prevData.datasets[1] },
          ],
        }));
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des prédictions :", error);
    }
  };

  // Fonction pour récupérer les données réelles (prix de l'action)
  const fetchRealData = async () => {
    try {
      const currentTime = new Date().toLocaleTimeString();
      const response = await axios.get("http://127.0.0.1:5001/latest-data");
      const realData = response.data;

      if (realData && realData.Close) {
        setChartData((prevData) => ({
          ...prevData,
          datasets: [
            { ...prevData.datasets[0] },
            {
              ...prevData.datasets[1],
              data: [...prevData.datasets[1].data, realData.Close],
            },
          ],
        }));

        // Récupérer les indicateurs après chaque nouvelle donnée
        const indicatorsResponse = await axios.get("http://127.0.0.1:5001/get-indicators");
        setIndicators((prevIndicators) => [
          ...prevIndicators,
          { ...indicatorsResponse.data, time: currentTime }, // Ajouter l'heure actuelle pour chaque ligne
        ]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des données réelles :", error);
    }
  };

  // Fonction pour gérer la pagination
  const paginateIndicators = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return indicators.slice(startIndex, endIndex);
  };

  // Effect hook pour gérer la fréquence des mises à jour
  useEffect(() => {
    const predictionInterval = setInterval(fetchPrediction, 50000); // 50 secondes pour la prédiction
    fetchPrediction(); // Charger la première prédiction immédiatement

    const realDataInterval = setInterval(fetchRealData, 60000); // 60 secondes pour les données réelles
    fetchRealData(); // Charger immédiatement la première valeur réelle

    return () => {
      clearInterval(predictionInterval);
      clearInterval(realDataInterval);
    };
  }, []);
  const [articles, setArticles] = useState([]);

  const fetchArticles = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5001/get-articles");
      setArticles(response.data.articles);
     
      
    } catch (error) {
      console.error("Erreur lors de la récupération des articles :", error);
    }
  };
  
  useEffect(() => {
    fetch('http://127.0.0.1:5001/get-articles')
        .then((response) => response.json())
        .then((data) => {
            console.log(data);  // Assurez-vous que vous voyez les données dans la console
            setArticles(data.articles); // Mettez à jour l'état avec les articles récupérés
        })
        .catch((error) => console.error('Error fetching data:', error));
}, []);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "20px" }}>
      {/* Section des recommandations à gauche */}
      <div style={{ width: "30%", backgroundColor: "#2c2c2c", color: "#fff", padding: "20px", borderRadius: "10px" }}>
        <h3>Recommandations</h3>
        {recommendations ? (
          <div>
            <p><strong>Conseil:</strong> {recommendations.recommendations}</p>
         </div>
        ) : (
          <p>Chargement des recommandations...</p>
        )}
      </div>


      <div style={{ width: "30%", backgroundColor: "#000", color: "#fff", padding: "20px", borderRadius: "10px" }}>
        <h2 style={{ textAlign: "center" }}>Articles Récents</h2>
        <div>
        <h1>Articles</h1>
        {Array.isArray(articles) && articles.length === 0 ? (
            <p>No articles found</p>
        ) : (
            <ul>
                {articles.map((article, index) => (
                    <li key={index}>
                        <h2>{article.Title}</h2>
                        <p>{article.Content}</p>
                        <small>{article.Info}</small>
                    </li>
                ))}
            </ul>
        )}
    </div>



      </div>
      {/* Section principale avec le graphique */}
      <div style={{ width: "65%", backgroundColor: "#000", color: "#fff", padding: "20px", borderRadius: "10px" }}>
        <h2 style={{ textAlign: "center" }}>Graphique en temps réel - Action Apple</h2>
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: "top",
                labels: {
                  color: "#fff",
                },
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: "Heure",
                  color: "#fff",
                },
                ticks: {
                  color: "#fff",
                },
              },
              y: {
                title: {
                  display: true,
                  text: "Prix (USD)",
                  color: "#fff",
                },
                ticks: {
                  color: "#fff",
                },
              },
            },
          }}
        />

        {/* Tableau des indicateurs */}
        <div style={{ marginTop: "30px", color: "#fff" }}>
          <h3>Indicateurs Techniques</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Heure</th>
                <th>SMA 20</th>
                <th>RSI</th>
                <th>MACD</th>
                <th>MACD Signal</th>
              </tr>
            </thead>
            <tbody>
              {paginateIndicators().map((indicator, index) => (
                <tr key={index}>
                  <td>{indicator.time}</td>
                  <td>{indicator.SMA_20}</td>
                  <td>{indicator.RSI}</td>
                  <td>{indicator.MACD}</td>
                  <td>{indicator.MACD_signal}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              style={{ margin: "0 5px", padding: "5px 10px", cursor: "pointer" }}
            >
              Précédent
            </button>
            <span style={{ alignSelf: "center", color: "#fff" }}>
              Page {currentPage} sur {Math.ceil(indicators.length / itemsPerPage)}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(indicators.length / itemsPerPage)))}
              style={{ margin: "0 5px", padding: "5px 10px", cursor: "pointer" }}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

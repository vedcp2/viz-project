const url = "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/mpg.csv";
let data;
let currentScene = 0;

// Load CSV and preprocess
d3.csv(url, d => ({
  mpg: +d.mpg,
  cylinders: +d.cylinders,
  displacement: +d.displacement,
  horsepower: +d.horsepower,
  weight: +d.weight,
  acceleration: +d.acceleration,
  model_year: +d.model_year,
  origin: d.origin,
  name: d.name
})).then(loaded => {
  data = loaded;
  renderScene(currentScene);
});

// Scene rendering logic
function renderScene(sceneIndex) {
  d3.select("#vis").html(""); // Clear previous scene

  if (sceneIndex === 0) renderScene1();
  else if (sceneIndex === 1) renderScene2();
  else if (sceneIndex === 2) renderScene3();

  document.getElementById("prevBtn").disabled = sceneIndex === 0;
  document.getElementById("nextBtn").disabled = sceneIndex === 2;
}

document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentScene > 0) {
    currentScene--;
    renderScene(currentScene);
  }
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (currentScene < 2) {
    currentScene++;
    renderScene(currentScene);
  }
});

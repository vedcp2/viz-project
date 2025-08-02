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

function renderScene1() {
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", 700)
    .attr("height", 500);

  svg.append("text")
    .attr("x", 350)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .text("Average MPG by Car Origin (1970–1974)");

  const filtered = data.filter(d => d.model_year >= 70 && d.model_year <= 74);

  // Aggregate MPG by origin
  const avgByOrigin = d3.rollup(
    filtered,
    v => d3.mean(v, d => d.mpg),
    d => d.origin
  );

  const entries = Array.from(avgByOrigin, ([origin, mpg]) => ({ origin, mpg }));

  const margin = { top: 60, right: 40, bottom: 40, left: 60 };
  const width = 700 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(entries.map(d => d.origin))
    .range([0, width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(entries, d => d.mpg)])
    .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));

  g.append("g")
    .call(d3.axisLeft(y));

  // Bars
  g.selectAll("rect")
    .data(entries)
    .enter()
    .append("rect")
    .attr("x", d => x(d.origin))
    .attr("y", d => y(d.mpg))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.mpg))
    .attr("fill", "steelblue");

  // Annotation
  g.selectAll("text.label")
    .data(entries)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.origin) + x.bandwidth() / 2)
    .attr("y", d => y(d.mpg) - 5)
    .attr("text-anchor", "middle")
    .text(d => d.mpg.toFixed(1));
}


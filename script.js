const url = "https://raw.githubusercontent.com/mwaskom/seaborn-data/master/mpg.csv";
let data;
let currentScene = 0;
let tooltip;

// Scene configurations
const scenes = [
  {
    title: "The Gas Guzzlers of the 1970s",
    annotation: "U.S. cars had significantly lower MPG than imports"
  },
  {
    title: "The Fuel Crisis Effect", 
    annotation: "Notice the sharp rise in MPG starting around 1974"
  },
  {
    title: "The Efficiency Leaders",
    annotation: "Japanese imports balance performance and efficiency"
  }
];

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
  console.log("Data loaded successfully:", loaded.length, "rows");
  data = loaded.filter(d => !isNaN(d.mpg) && !isNaN(d.horsepower) && d.horsepower > 0);
  console.log("Filtered data:", data.length, "rows");
  console.log("Sample data:", data.slice(0, 3));
  tooltip = d3.select("#tooltip");
  renderScene(currentScene);
}).catch(error => {
  console.error("Error loading data:", error);
  // Fallback: show error message
  d3.select("#vis").append("div")
    .style("color", "red")
    .style("font-size", "16px")
    .style("margin", "20px")
    .text("Error loading data. Please check your internet connection.");
});

// Scene rendering logic
function renderScene(sceneIndex) {
  console.log("Rendering scene:", sceneIndex, "Data available:", !!data);
  d3.select("#vis").html(""); // Clear previous scene
  
  // Show/hide exploration controls based on scene
  const explorationControls = document.getElementById("explorationControls");
  explorationControls.style.display = sceneIndex === 2 ? "block" : "none";

  if (!data) {
    console.error("No data available for rendering");
    return;
  }

  if (sceneIndex === 0) renderScene1();
  else if (sceneIndex === 1) renderScene2();
  else if (sceneIndex === 2) renderScene3();

  document.getElementById("prevBtn").disabled = sceneIndex === 0;
  document.getElementById("nextBtn").disabled = sceneIndex === 2;
}

// Navigation event listeners
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

// Exploration dropdown event listener
document.getElementById("groupBySelect").addEventListener("change", () => {
  if (currentScene === 2) {
    renderScene3();
  }
});

// Scene 1: Bar chart of average MPG by origin (1970-1974)
function renderScene1() {
  console.log("Rendering Scene 1");
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

  const margin = { top: 80, right: 40, bottom: 60, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  svg.append("text")
    .attr("x", 400)
    .attr("y", 30)
    .attr("class", "scene-title")
    .attr("text-anchor", "middle")
    .text(scenes[0].title);

  const filtered = data.filter(d => d.model_year >= 70 && d.model_year <= 74);
  console.log("Scene 1 filtered data:", filtered.length, "rows");

  // Aggregate MPG by origin using D3 v5 nest
  const nested = d3.nest()
    .key(d => d.origin)
    .rollup(values => d3.mean(values, d => d.mpg))
    .entries(filtered);

  const entries = nested.map(d => ({ origin: d.key, mpg: d.value }));
  console.log("Scene 1 aggregated data:", entries);

  const x = d3.scaleBand()
    .domain(entries.map(d => d.origin))
    .range([0, width])
    .padding(0.3);

  const y = d3.scaleLinear()
    .domain([0, d3.max(entries, d => d.mpg) + 2])
    .range([height, 0]);

  // Color scale
  const colorScale = d3.scaleOrdinal()
    .domain(["usa", "europe", "japan"])
    .range(["#d62728", "#2ca02c", "#1f77b4"]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("Car Origin");

  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("Average MPG");

  // Bars
  g.selectAll("rect")
    .data(entries)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.origin))
    .attr("y", d => y(d.mpg))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.mpg))
    .attr("fill", d => colorScale(d.origin))
    .on("mouseover", function(d) {
      showTooltip(`${d.origin}: ${d.mpg.toFixed(1)} MPG`);
    })
    .on("mouseout", hideTooltip);

  // Value labels
  g.selectAll("text.label")
    .data(entries)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.origin) + x.bandwidth() / 2)
    .attr("y", d => y(d.mpg) - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text(d => d.mpg.toFixed(1));

  // Annotation
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("class", "scene-annotation")
    .text(scenes[0].annotation);
}

// Scene 2: Line chart showing MPG over time (1970-1982)
function renderScene2() {
  console.log("Rendering Scene 2");
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

  const margin = { top: 80, right: 40, bottom: 60, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  svg.append("text")
    .attr("x", 400)
    .attr("y", 30)
    .attr("class", "scene-title")
    .attr("text-anchor", "middle")
    .text(scenes[1].title);

  // Filter and aggregate data by year
  const filtered = data.filter(d => d.model_year >= 70 && d.model_year <= 82);
  console.log("Scene 2 filtered data:", filtered.length, "rows");
  
  // Use D3 v5 nest instead of rollup
  const nested = d3.nest()
    .key(d => d.model_year)
    .rollup(values => d3.mean(values, d => d.mpg))
    .entries(filtered);

  const lineData = nested.map(d => ({ 
    year: +d.key + 1900, 
    mpg: d.value 
  })).sort((a, b) => a.year - b.year);
  
  console.log("Scene 2 line data:", lineData);

  const x = d3.scaleLinear()
    .domain(d3.extent(lineData, d => d.year))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([10, d3.max(lineData, d => d.mpg) + 2])
    .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("Model Year");

  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("Average MPG");

  // Line generator
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.mpg))
    .curve(d3.curveMonotoneX);

  // Draw line
  g.append("path")
    .datum(lineData)
    .attr("class", "line")
    .attr("d", line)
    .attr("stroke", "#1f77b4");

  // Add points
  g.selectAll("circle")
    .data(lineData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.mpg))
    .attr("r", 5)
    .attr("fill", "#1f77b4")
    .on("mouseover", function(d) {
      showTooltip(`${d.year}: ${d.mpg.toFixed(1)} MPG`);
    })
    .on("mouseout", hideTooltip);

  // Highlight oil crisis period
  g.append("rect")
    .attr("x", x(1973))
    .attr("y", 0)
    .attr("width", x(1975) - x(1973))
    .attr("height", height)
    .attr("fill", "orange")
    .attr("opacity", 0.2);

  g.append("text")
    .attr("x", x(1974))
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "#ff7f0e")
    .text("Oil Crisis");

  // Annotation
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("class", "scene-annotation")
    .text(scenes[1].annotation);
}

// Scene 3: Scatter plot with exploration
function renderScene3() {
  console.log("Rendering Scene 3");
  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", 800)
    .attr("height", 500);

  const margin = { top: 80, right: 120, bottom: 60, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  svg.append("text")
    .attr("x", 400)
    .attr("y", 30)
    .attr("class", "scene-title")
    .attr("text-anchor", "middle")
    .text(scenes[2].title);

  const filtered = data.filter(d => !isNaN(d.horsepower) && d.horsepower > 0);
  console.log("Scene 3 filtered data:", filtered.length, "rows");

  const x = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d.horsepower) + 20])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(filtered, d => d.mpg) + 5])
    .range([height, 0]);

  const colorScale = d3.scaleOrdinal()
    .domain(["usa", "europe", "japan"])
    .range(["#d62728", "#2ca02c", "#1f77b4"]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("Horsepower");

  g.append("g")
    .call(d3.axisLeft(y))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .attr("class", "axis-label")
    .style("text-anchor", "middle")
    .text("MPG");

  // Scatter points
  g.selectAll("circle")
    .data(filtered)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.horsepower))
    .attr("cy", d => y(d.mpg))
    .attr("r", 4)
    .attr("fill", d => colorScale(d.origin))
    .attr("opacity", 0.7)
    .on("mouseover", function(d) {
      showTooltip(`${d.name}<br/>MPG: ${d.mpg}<br/>HP: ${d.horsepower}<br/>Origin: ${d.origin}`);
    })
    .on("mouseout", hideTooltip);

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.left + 20}, ${margin.top + 20})`);

  const origins = ["usa", "europe", "japan"];
  origins.forEach((origin, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("circle")
      .attr("r", 6)
      .attr("fill", colorScale(origin));

    legendRow.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .attr("class", "legend")
      .text(origin.toUpperCase());
  });

  // Annotation
  g.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("class", "scene-annotation")
    .text(scenes[2].annotation);

  // Handle exploration dropdown
  const groupBy = document.getElementById("groupBySelect").value;
  if (groupBy !== "origin") {
    updateExploration(groupBy, g, width, height);
  }
}

// Exploration feature for Scene 3
function updateExploration(groupBy, g, width, height) {
  // This function can be extended to show different visualizations
  // based on the selected groupBy option
  console.log("Exploring by:", groupBy);
}

// Tooltip functions
function showTooltip(content) {
  tooltip.style("opacity", 1)
    .html(content)
    .style("left", (d3.event.pageX + 10) + "px")
    .style("top", (d3.event.pageY - 10) + "px");
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}


<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script src="https://d3js.org/d3.v5.min.js"></script>
</head>
<body onload="init()">
  <div id="controls"></div>
  <div id="scene"></div>

  <script>
    let data;
    let params = { scene: 1, filterOrigin: null };

    function init() {
      d3.csv("https://raw.githubusercontent.com/selva86/datasets/master/Auto.csv", d3.autoType)
        .then(raw => {
          // NOTE: If headers are quoted like "name", use d['"name"']
          data = raw.filter(d => d["mpg"] && d.weight && d.cylinders && d["origin"]);
          setupControls();
          drawScene();
        });
    }

    function setupControls() {
      const controls = d3.select("#controls")
        .html("<button id='next'>Next</button><br>Origin filter: ")
        .append("select")
        .attr("id", "originSelector")
        .on("change", () => {
          params.filterOrigin = d3.select("#originSelector").property("value");
          drawScene();
        });

      d3.select("#next").on("click", () => {
        params.scene = Math.min(params.scene + 1, 3);
        drawScene();
      });
    }

    function drawScene() {
      d3.select("#scene").html(""); // clear scene
      const svg = d3.select("#scene")
        .append("svg").attr("width", 500).attr("height", 400);

      const margin = { top: 40, left: 60, right: 20, bottom: 60 }, w = 400, h = 300;
      const x = d3.scaleLinear().domain(d3.extent(data, d => d.weight)).range([0, w]);
      const y = d3.scaleLinear().domain(d3.extent(data, d => d["mpg"])).range([h, 0]);

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const filteredData = data.filter(d => {
        if (params.scene === 2) return d.cylinders <= 4 || d.weight < 3000;
        if (params.scene === 3 && params.filterOrigin) return d["origin"] === params.filterOrigin;
        return true;
      });

      g.selectAll("circle")
        .data(filteredData).enter().append("circle")
        .attr("cx", d => x(d.weight))
        .attr("cy", d => y(d["mpg"]))
        .attr("r", d => 2 + d.cylinders)
        .attr("fill", d => {
          if (params.scene === 2 && (d.cylinders <= 4 || d.weight < 3000)) return "orange";
          return "steelblue";
        })
        .on("mouseover", (evt, d) => {
          if (params.scene === 3) {
            const tip = g.append("text")
              .attr("id", "tt")
              .attr("x", x(d.weight) + 10)
              .attr("y", y(d["mpg"]) - 10)
              .text(`${d['"name"']}: ${d["mpg"]} mpg`);
          }
        })
        .on("mouseout", () => g.select("#tt").remove());

      // Axes
      g.append("g").call(d3.axisLeft(y));
      g.append("g").attr("transform", `translate(0,${h})`).call(d3.axisBottom(x));

      // Titles
      if (params.scene === 1) {
        svg.append("text")
          .attr("x", margin.left + 20).attr("y", margin.top - 10)
          .text("All cars: poopy vs weight")
          .attr("font-weight", "bold");
      }
      if (params.scene === 2) {
        svg.append("text")
          .attr("x", margin.left + 20).attr("y", margin.top - 10)
          .text("Highlighted: ≤4 cylinders or <3000 lbs")
          .attr("font-weight", "bold");
      }
      if (params.scene === 3) {
        svg.append("text")
          .attr("x", margin.left + 20).attr("y", margin.top - 10)
          .text("Explore by Origin")
          .attr("font-weight", "bold");

        const selector = d3.select("#originSelector");

        if (selector.selectAll("option").empty()) {
          const origins = Array.from(new Set(data.map(d => d["origin"])));
          selector.selectAll("option")
            .data([""].concat(origins)).enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d || "All");
        }

        // Keep current selection
        selector.property("value", params.filterOrigin || "");
      }
    }
  </script>
</body>
</html>

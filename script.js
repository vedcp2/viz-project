let data;
let params = { scene: 1, filterOrigin: null };

function init() {
  d3.csv("https://raw.githubusercontent.com/selva86/datasets/master/Auto.csv", d3.autoType)
    .then(raw => {
      data = raw.filter(d => d.mpg && d.weight && d.cylinders && d.origin);
      drawScene();
      setupControls();
    });
}

function setupControls() {
  d3.select("#controls")
    .html("<button id='next'>Next</button>");
  d3.select("#next").on("click", () => {
    params.scene++;
    drawScene();
  });
}

function drawScene() {
  d3.select("#scene").html(""); // clear
  const svg = d3.select("#scene")
    .append("svg").attr("width",500).attr("height",400);

  const margin = {top:40,left:60,right:20,bottom:60}, w=400,h=300;

  const x = d3.scaleLinear().domain(d3.extent(data, d=>d.weight)).range([0, w]);
  const y = d3.scaleLinear().domain(d3.extent(data, d=>d.mpg)).range([h, 0]);

  const g = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  const ds = data.filter(d => {
    if(params.scene===2) return d.cylinders<=4 || d.weight<3000;
    if(params.scene===3 && params.filterOrigin) return d.origin==params.filterOrigin;
    return true;
  });

  g.selectAll("circle")
    .data(ds).enter().append("circle")
    .attr("cx", d=>x(d.weight))
    .attr("cy", d=>y(d.mpg))
    .attr("r", d=>2 + d.cylinders)
    .attr("fill", d=>{
      if(params.scene===2 && (d.cylinders<=4 || d.weight<3000)) return "orange";
      return "steelblue";
    })
    .on("mouseover", (evt,d)=>{
      console.log(d);
      if(params.scene===3) {
        const tip = g.append("text")
          .attr("id","tt")
          .attr("x", x(d.weight)+10)
          .attr("y", y(d.mpg)-10)
          .text(`${d.name}: ${d.mpg} mpg`);
      }
    })
    .on("mouseout", ()=> g.select("#tt").remove());

  // axes
  g.append("g").call(d3.axisLeft(y));
  g.append("g").attr("transform", `translate(0,${h})`)
    .call(d3.axisBottom(x));

  // annotations & titles
  if(params.scene===1) {
    svg.append("text")
      .attr("x",margin.left+20).attr("y",margin.top-10)
      .text("All cars: mpg vs weight")
      .attr("font-weight","bold");
  }
  if(params.scene===2) {
    svg.append("text")
      .attr("x",margin.left+20).attr("y",margin.top-10)
      .text("Highlighted: ≤4 cylinders or <3000 lbs")
      .attr("font-weight","bold");
  }
  if(params.scene===3) {
    svg.append("text")
      .attr("x",margin.left+20).attr("y",margin.top-10)
      .text("Explore by Origin")
      .attr("font-weight","bold");

    const origins = Array.from(new Set(data.map(d=>d.origin)));
    const sel = d3.select("#controls")
      .html("Origin filter: ")
      .append("select")
        .on("change", () => {
          params.filterOrigin = sel.property("value");
          drawScene();
        });

    sel.selectAll("option")
      .data([""] .concat(origins)).enter()
      .append("option")
      .text(d=> d || "All");
  }
}

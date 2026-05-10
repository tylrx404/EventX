const CHART_COLORS = {
navy:"#0f1e3c",
amber:"#f5a623",
blue:"#3b82f6",
green:"#22c55e",
red:"#ef4444",
purple:"#8b5cf6",
teal:"#14b8a6",
orange:"#f97316"
};

const PALETTE = Object.values(CHART_COLORS);

let _charts = {};

async function loadAnalytics(){

const section = document.getElementById("analyticsSection");
if(!section) return;

try{

const res = await fetch(API+"/admin/analytics",{headers:authHeaders()});

if(!res.ok) throw new Error("Failed");

const data = await res.json();

renderAnalytics(data);

}catch{

section.innerHTML=`
<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--muted)">
️ Could not load analytics data.
</div>`;

}

}

function renderAnalytics(data){

const section = document.getElementById("analyticsSection");

section.innerHTML = `

<div class="analytics-stats">

<div class="stat-card">
<div class="stat-title">Total Events</div>
<div class="stat-value">${data.totalEvents || 0}</div>
</div>

<div class="stat-card">
<div class="stat-title">Total Registrations</div>
<div class="stat-value">${data.totalRegistrations || 0}</div>
</div>

<div class="stat-card">
<div class="stat-title">Active Events</div>
<div class="stat-value">${data.activeEvents || 0}</div>
</div>

<div class="stat-card">
<div class="stat-title">Avg Registrations/Event</div>
<div class="stat-value">${data.avgRegistrations || 0}</div>
</div>

</div>

<div class="analytics-grid">

<div class="chart-card wide">
<div class="chart-title"> Daily Registration Trend</div>
<div class="chart-wrap"><canvas id="chartRegTime"></canvas></div>
</div>

<div class="chart-card">
<div class="chart-title">️ Event Category Distribution</div>
<div class="chart-wrap chart-wrap-sm"><canvas id="chartCategory"></canvas></div>
</div>

<div class="chart-card">
<div class="chart-title"> Registration Growth by Month</div>
<div class="chart-wrap"><canvas id="chartMonthly"></canvas></div>
</div>

<div class="chart-card wide">
<div class="chart-title"> Event Participation</div>
<div class="chart-wrap"><canvas id="chartTopEvents"></canvas></div>
</div>

</div>
`;

Object.values(_charts).forEach(c=>c.destroy());
_charts={};

Chart.defaults.font.family="'Inter', sans-serif";
Chart.defaults.font.size=12;
Chart.defaults.color="#6b7280";

setTimeout(()=>{

buildRegistrationsOverTime(data.registrationsOverTime || []);
buildCategoryDoughnut(data.eventsByCategory || []);
buildMonthlyBar(data.monthlyRegistrations || []);
buildTopEvents(data.topEvents || []);

},0);

}

function buildRegistrationsOverTime(rows){

const ctx=document.getElementById("chartRegTime");
if(!ctx) return;

if(!rows.length){
ctx.parentElement.innerHTML="<p style='text-align:center;color:#888'>No data available</p>";
return;
}

const labels=rows.map(r=>{
const d=new Date(r.day);
return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"});
});

const counts=rows.map(r=>r.count);

_charts.regTime=new Chart(ctx,{
type:"line",
data:{
labels,
datasets:[{
label:"Registrations",
data:counts,
borderColor:CHART_COLORS.navy,
backgroundColor:"rgba(15,30,60,0.08)",
borderWidth:2.5,
pointBackgroundColor:CHART_COLORS.amber,
pointRadius:4,
fill:true,
tension:0.4
}]
},
options:{
responsive:true,
plugins:{legend:{display:false}},
scales:{
y:{beginAtZero:true,ticks:{stepSize:1}},
x:{grid:{display:false}}
}
}
});

}

function buildCategoryDoughnut(rows){

const ctx=document.getElementById("chartCategory");
if(!ctx) return;

if(!rows.length){
ctx.parentElement.innerHTML="<p style='text-align:center;color:#888'>No data available</p>";
return;
}

const colors=rows.map((_,i)=>PALETTE[i%PALETTE.length]);

_charts.category=new Chart(ctx,{
type:"doughnut",
data:{
labels:rows.map(r=>r.category),
datasets:[{
data:rows.map(r=>r.count),
backgroundColor:colors,
borderWidth:2,
borderColor:"#fff"
}]
},
options:{responsive:true}
});

}

function buildMonthlyBar(rows){

const ctx=document.getElementById("chartMonthly");
if(!ctx) return;

if(!rows.length){
ctx.parentElement.innerHTML="<p style='text-align:center;color:#888'>No data available</p>";
return;
}

_charts.monthly=new Chart(ctx,{
type:"bar",
data:{
labels:rows.map(r=>r.month),
datasets:[{
label:"Registrations",
data:rows.map(r=>r.count),
backgroundColor:"rgba(15,30,60,0.2)"
}]
},
options:{
responsive:true,
plugins:{legend:{display:false}}
}
});

}

function buildTopEvents(rows){

const ctx=document.getElementById("chartTopEvents");
if(!ctx) return;

if(!rows.length){
ctx.parentElement.innerHTML="<p style='text-align:center;color:#888'>No data available</p>";
return;
}

const colors=rows.map((_,i)=>PALETTE[i%PALETTE.length]);

_charts.topEvents=new Chart(ctx,{
type:"bar",
data:{
labels:rows.map(r=>r.title),
datasets:[{
label:"Registrations",
data:rows.map(r=>r.registrations),
backgroundColor:colors
}]
},
options:{
indexAxis:"y",
responsive:true,
plugins:{legend:{display:false}}
}
});

}
function buildYearChart(rows) {
  const ctx = document.getElementById("chartYearParticipation");
  if (!ctx) return;

  _charts.year = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rows.map(r => r.name),
      datasets: [{
        label: 'Participants',
        data: rows.map(r => r.count),
        backgroundColor: CHART_COLORS.blue,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}
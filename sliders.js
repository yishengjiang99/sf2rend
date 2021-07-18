
import {insts} from './gmlist.js';
const selecthtml=document.querySelector("#insttemplate");
	const tracks = document.querySelectorAll("tr");
	const uicontrols=[];
	const rowheight=40,colwidth=80;
	const pixelPerDecibel = rowheight;
		const pixelPerSec= colwidth/2;
	for(const track of tracks){
		const sele=track.querySelector("select");
		insts.forEach((v,idx)=>sele.appendChild(new Option(v,idx)));
		uicontrols.push({
preset:sele,
led: track.querySelector("input[type='checkbox']"),
meters: Array.from(track.querySelectorAll("meter")),
sliders: Array.from(track.querySelectorAll("sliders")),
numerics:Array.from(track.querySelectorAll("sliders")),
polylines: Array.from(track.querySelectorAll("polyline")),
set pid(id){
	this.preset.value=id
},
onload(){
	this.preset.innerHTML=selecthtml;
},
set midi(v){
	this.meters[0].value=v;
},
set vel(v){
	this.meters[1].value=v;
},
set active(b){
	b ? this.led.setAttribute("checked",'checked') : this.led.removeAttribute("checked")
},
set env1({phases:[a,d,s,r],peak}){
	const points=[[0,0], [a, 1],[a+d,(100-s)/100], [a+d+r, 0]].map(([x,y])=> [x*pixelPerSec,rowheight-y*rowheight].join(",")).join(" ");
	console.log(points)
	this.polylines[0].setAttribute("points", points);
},
set env2({phases:[a,d,s,r],peak}){
	const points=[[0,0], [a, 1],[a+d,(100-s)/100], [a+d+r, 0]].map(([x,y])=> x*pixelPerSec+","+y*pixelPerDecibel).join(" ");
	console.log(points)
	this.polylines[1].setAttribute("points", points);
}
		})
	}

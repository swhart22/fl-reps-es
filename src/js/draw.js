'use strict';
import '../css/nbcotsbase.css';

import '../css/nbcotsbase.css';
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.eot'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.svg'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.ttf'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.woff'
import '../css/font-awesome-4.7.0/fonts/fontawesome-webfont.woff2'
import '../css/font-awesome-4.7.0/fonts/FontAwesome.otf'
import '../css/font-awesome-4.7.0/css/font-awesome.min.css';

import colors from './colors.js';
import * as L from 'leaflet';
import {nest} from 'd3-collection';
import {json, csv} from 'd3-request';
import {sort, ascending, descending} from 'd3-array';
import {select, selectAll} from 'd3-selection';
import {scaleOrdinal} from 'd3-scale';
import {max} from 'd3-array';
import {format} from 'd3-format';
const classifyPoint = require("robust-point-in-polygon");

const topojson = require("topojson");
let dataDir = ENV === 'development' ? '../../data/' : 'data/';
let width = parseInt(select('#container').style('width')),
isMobile = false,
is620 = false , 
isDesktop = false;

let ua = navigator.userAgent.toLowerCase();
let isWebview = ua.indexOf("chrome") > -1 && ua.indexOf('mobile') > -1;

isWebview ? select('#android-warning').html("Nota para usuarios de Android: Si la barra de búsqueda en su aplicación móvil no funciona para usted, por favor utilice nuestra herramienta en <a href='https://bit.ly/2Xp1I0Z' target='_blank'>su navegador de internet</a>.") : select('#android-warning').html("")

width <= 400 ? isMobile = true : width <= 730 ? is620 = true : isDesktop = true;

let xtalkResize = function (){
	return ENV === 'development' ? () => {} : xtalk.signalIframe()
}

let mayorColors = ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'];

async function draw(){
	
	async function loadFlaTopo(){
		return new Promise((resolve, reject) => {
			json(dataDir + 'districts-topo.json', (error, data) => {
				if (error) throw error;
				resolve(data);
				// reject(console.log('error loading florida topojson'))
			})
		})
	}

	async function loadReps(){
		return new Promise((resolve, reject) => {
			csv(dataDir + 'fl-reps-info.csv', (error, data) => {
				if (error) throw error;
				resolve(data)
			})
		})
	}

	let floridaDistricts = await loadFlaTopo();
	let representatives = await loadReps();

	let groupedReps = nest().key(d => d['Office']).key(d => d['District']).object(representatives);	

	floridaDistricts.objects['house'].geometries = floridaDistricts.objects['house'].geometries.map(geo => {
		let dist = geo.properties['NAME'];
		if (groupedReps['State Representative'][dist]){
			geo.properties.rep = groupedReps["State Representative"][dist][0]
		} else {
			geo.properties.rep = null
		}
		
		return geo;
	});

	floridaDistricts.objects['sen'].geometries = floridaDistricts.objects['sen'].geometries.map(geo => {
		let dist = geo.properties['NAME'];
		if (groupedReps['State Senator'][dist]){
			geo.properties.sen = groupedReps["State Senator"][dist][0]
		} else {
			geo.properties.sen = null
		}
		
		return geo;
	});

	// console.log(floridaDistricts);
	let lMap = L.map('leaflet-map', {
		zoomControl: false, 
		attributionControl: false
	});
	let view,
	desktopView = [[27.965067489791505, -82.90188789367676], 6],
	mobileView = [[27.965067489791505, -82.90188789367676], 6];

	view = isDesktop ? desktopView : isMobile ? mobileView : mobileView;
	// console.log(isMobile)

	//view originally computed with leaflet getBounds, hard-coded for performance
	lMap.setView(view[0], view[1]);
	L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
		subdomains: 'abcd',
		maxZoom: 19
	}).addTo(lMap);
	// lMap.scrollWheelZoom.disable();

	lMap.on('zoomend moveend', () => {
		console.log(lMap.getCenter())
	})

	let svgLoaded = false;
	let marker;

	let features;
	async function addSvgLayer(Data, collection){

		let interiors = topojson.mesh(Data, Data.objects[collection], (a, b) => a !== b),
		exteriors = topojson.mesh(Data, Data.objects[collection], (a, b) => a === b),
		revInterior = interiors.coordinates.map(arr => {
			return arr.map(coords => {
				return [coords[1], coords[0]]
			})
		}),
		revExterior = exteriors.coordinates.map(arr => {
			return arr.map(coords => {
				return [coords[1], coords[0]]
			})
		});

		let lineStyle = {
			color:colors['blue']['02'],
			weight:1.5
		}
		
		features = topojson.feature(Data, Data.objects[collection]).features;
		
		for (let i = 0; i < features.length; i++){
			let feat = features[i];
			let reverse;

			if (feat.geometry.type == 'Polygon'){
				reverse = feat.geometry.coordinates.map(arr => {
					return arr.map(coords => {
						return [coords[1], coords[0]]
					})
		 		});
			} else {
				reverse = feat.geometry.coordinates.map(arr => {
					return arr.map(arr2 => {
						return arr2.map(coords => {
							return [coords[1], coords[0]]
						})
					})
		 		});
			}
			
		 	feat.reverse = reverse;
		 	
			let poly = L.polygon(reverse, {
				stroke:false,
				opacity:0,
				fillOpacity:0.7,
				className:'shape',
				fillColor:'#fff'
			}).addTo(lMap);
			// poly.on('click', function(e){
			// 	let loc = e.latlng;
			// 	updateMap(feat, [loc.lng, loc.lat])
			// })
		}
		
		marker = L.circleMarker([0,0], {
			radius: 5,
			stroke:false,
			fillColor:colors['red']['03'],
			fillOpacity:1
		}).addTo(lMap);

		let lInteriors = L.polyline(revInterior, lineStyle).addTo(lMap),
		lExterior = L.polyline(revExterior, lineStyle).addTo(lMap);

		svgLoaded = true;
	}
	// await addSvgLayer(Data, 'wards');
	await addSvgLayer(floridaDistricts, 'house')
	await addSvgLayer(floridaDistricts, 'sen')

	let input = document.querySelector("#ward-input");
	let search = document.querySelector('#ward-submit');
	let errorDiv = document.querySelector("#ward-error");
	let wardResultsDiv = document.querySelector("#find-ward");
	let resultsDiv = document.querySelector('#ward-results');

	async function geoCodeInput(address){
		return new Promise((resolve, reject) => {
			json('https://nominatim.openstreetmap.org/search.php?q=' + address + '&format=json', (error, res) => {
				// console.log(res);
				let output = res.length == 0 ? 'error finding place' : res[0];
				resolve(output)
				reject('json unfetched')
			})
		}) 
	}

	
	function findShape(coords, features){
		let shape = null;
		features.forEach(feat => {
			if (feat.geometry.type == 'MultiPolygon'){
				feat.geometry.coordinates.forEach((island, i) => {
					if ((classifyPoint(island[0], coords) == -1) | (classifyPoint(island[0], coords) == 0)){
						shape = feat;
					}
				})
			} else {
				if ((classifyPoint(feat.geometry.coordinates[0], coords) == -1) | (classifyPoint(feat.geometry.coordinates[0], coords) == 0)){
					shape = feat;
				}
			}
		})
		// console.log(features);
		// let shape = features.find(feat => classifyPoint(feat.geometry.coordinates[0], coords) == -1 | classifyPoint(feat.geometry.coordinates[0], coords) == 0)

		return shape != null ? shape : 'address not found in Florida';
		// return polygon.polygonContains()
	}
	// let res = document.querySelector('@');
	let body = document.querySelector('body');
	// body.onclick = function(e){
	// 	return e.target.classList.contains('ward') ? {} : initializeResults();
	// };
	search.onclick = searchWards;
	input.onchange = searchWards;

	async function searchWards(){
		!svgLoaded ? errorDiv.innerHTML = '<p>Loading Chicago\'s ward boundaries, please wait.</p>' : ''
		let place = await geoCodeInput(input.value);
		console.log(place);

		if (place == 'error finding place'){
			resultsDiv.style.display = 'none';
			errorDiv.style.display = 'block';
			errorDiv.innerHTML = '<p>No pudimos localizar <strong>' + input.value + '</strong>. Por favor busque una dirección del área de Miami.</p>';
			xtalkResize();
		} else {
			let coordinates = [+place.lon, +place.lat],
			houseShape = findShape(coordinates, topojson.feature(floridaDistricts, floridaDistricts.objects['house']).features),
			senShape = findShape(coordinates, topojson.feature(floridaDistricts, floridaDistricts.objects['sen']).features),
			shapes = {'house':houseShape, 'sen':senShape};

			if (houseShape | senShape == 'address not found in Florida'){
				console.log(place)
				resultsDiv.style.display = 'none';
				errorDiv.style.display = 'block';
				errorDiv.innerHTML = '<p>No pudimos localizar <strong>' + input.value + '</strong> en el área de Miami. Por favor busque una dirección del área de Miami.</p>';
				xtalkResize();
			} else {
				errorDiv.style.display = 'none';
				resultsDiv.style.display = 'flex';
				updateMap(shapes, coordinates);
				// select("#map-and-results").style('class','space-between');
				xtalkResize();
			}
		}	
	}
	// d3.selectAll('.shape').style('fill-opacity',1)
	function updateMap(shapes, coordinates){
		// console.log(shapes);
		let hDistrict = shapes.house.properties.rep['District'],
		hName = shapes.house.properties.rep['Name'],
		sDistrict = shapes.sen.properties.sen['District'],
		sName = shapes.sen.properties.sen['Name'],
		img = 'placeholder.jpg',
		hParty = shapes.house.properties.rep['Party'] == 'R' ? colors['red']['03'] : colors['blue']['03'],
		sParty = shapes.sen.properties.sen['Party'] == 'R' ? colors['red']['03'] : colors['blue']['03'],
		hSite = shapes.house.properties.rep['Website'],
		sSite = shapes.sen.properties.sen['Website'],
		hPartyName = shapes.house.properties.rep['Party'] == 'R' ? 'Republicano' : 'Demócrata', 
		sPartyName = shapes.sen.properties.sen['Party'] == 'R' ? 'Republicano' : 'Demócrata',
		hPhoto = dataDir + 'photos/' + shapes.house.properties.rep['Photo'],
		sPhoto = dataDir + 'photos/' + shapes.sen.properties.sen['Photo'];
		// console.log(sPhoto);
		// let wn = shape.properties.results['WARD'];
		// let turnout = shape.properties.results['Turnout (%)']
		//ward number
		// listOfCandidates = listOfCandidates.sort((a,b) => descending(+wResults[a], +wResults[b]));
		resultsDiv.innerHTML = '<div class="house-rep"><div class="pol-icon" style="border-color:'+hParty+'; background-image: url(\''+hPhoto+'\');"></div><div class="pol-text"><p class="office-signifier">Representante Estatal</p>' + 
			'<p class="dist-name">'+hName+'</p>' +
			'<p class="rep-name">Distrito ' + hDistrict + '</p>' +
			'<p>Partido: '+hPartyName+'</p>' + 
			'<p><a href="'+hSite+'" target="_blank">Website <i class="fa fa-external-link" aria-hidden="true"></i></a></p>'+
			'</div></div>';

		resultsDiv.innerHTML += '<div class="house-rep"><div class="pol-icon" style="border-color:'+hParty+'; background-image: url(\''+sPhoto+'\');"></div><div class="pol-text"><p class="office-signifier">Senador Estatal</p>' + 
			'<p class="dist-name">'+sName+'</p>' +
			'<p class="rep-name">Distrito ' + sDistrict + '</p>' + 
			'<p>Partido: '+hPartyName+'</p>' + 
			'<p><a href="'+hSite+'" target="_blank">Website <i class="fa fa-external-link" aria-hidden="true"></i></a></p>'+
			'</div></div>';
		// resultsDiv.innerHTML += '<p id="exit"><em>Click anywhere blank on the map or outside of the map to return to default view.</em></p>';

		// marker.setLatLng([coordinates[1], coordinates[0]])

		// lMap.flyToBounds(shape.reverse)
		xtalkResize();
	}
	function initializeResults(){
		
		let total = Results.find(res => res['WARD'] == 'Contest Total');
		let turnout = total['Turnout (%)'];
		// listOfCandidates = listOfCandidates.sort((a,b) => descending(+total[a], +total[b]));

		resultsDiv.innerHTML = '<p id="turnout">Voter Turnout: '+turnout+'%</p>';
		
		resultsDiv.innerHTML += '<table id="cand-table"><tbody><tr><th>Name</th><th>Votes</th></tr>' + 
			listOfCandidates.map(cand => ' <tr class="'+cand+'" style="border-left-style:solid; border-left-width:7px; border-left-color:'+resScale(cand)+'"><td> ' + cand + '</td><td>'+format(',')(total[cand])+'</td></tr>').join('') +
			'</tbody></table>';

		marker.setLatLng([0, 0])

		lMap.flyTo(view[0], view[1])
		xtalkResize();
	}
	// initializeResults();
	//append all chart elements to g variable
	//happy coding!
		
};

export default draw;

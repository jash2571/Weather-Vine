const API_KEY = "600c15d8353e8561102ce53c86bb153a";
const time = document.querySelector('.time');
const temp_span = document.querySelector('.temp span');
const temp_desc = document.querySelector('.weather p:last-of-type');
const wind_speed = document.querySelector('.wind-speed');
const humidity = document.querySelector('.humidity');
const city_span = document.querySelector('.city span');
const aside = document.querySelector('aside');
const section = document.querySelector('#dashboard');
const settings = document.querySelector('#settings');
const input = document.getElementById("city");
const links = document.querySelectorAll('header .container');
const theme = document.querySelector('#theme');

let locationAccepted = false;

let gl_xvalues;
let gl_temp_y;

// async function initMap() {
//     const options = {
//     fields: ["address_components", "geometry", "icon", "name"],
//     strictBounds: false,
//     types: ["establishment"],
//     };
//     const autocomplete = new google.maps.places.Autocomplete(input, options);
//     autocomplete.addListener('place_changed',()=>{
//         let place = autocomplete.getPlace();
//         console.log(place);
//         let lat = place.geometry.location.lat();
//         let lon = place.geometry.location.lng();
//         console.log(lat,lon);
//         getWeather(lat,lon);
//     });
// }

links.forEach((link) => {
    link.addEventListener('click',(e)=>{
        links.forEach((link) => {
            link.classList.remove('active');
        });

        link.classList.add('active');
        if(link.children[0].children[1].textContent.toLowerCase() == "dashboard"){
            section.style.display = 'block';
            aside.style.visibility = 'visible';
            settings.style.display = 'none';
            aside.classList.remove('aside-hide');
        }else{
            settings.style.display = 'block';
            section.style.display = 'none';
            aside.style.visibility = 'hidden';
            aside.classList.add('aside-hide');
        }
    })
})

theme.addEventListener('change',()=>{
    // if(document.getRootNode())
    if(theme.checked){
        document.documentElement.dataset.theme = "dark";
        localStorage.setItem('weather-vine-theme','dark');
    }else{
        document.documentElement.dataset.theme = "light";
        localStorage.setItem('weather-vine-theme','light');
    }
    if(locationAccepted)
        createChart();
})

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

const createForecastCard = (day,date,month,temp,img) => {
    date = date >= 10 ? date : '0' + date; 
    const card = `<div class="card">
    <div class="daytime">
        <span>${day}</span>
        <span>${date} ${month}</span>
    </div>
    <p class="temp"><span>${temp}</span><sup>&deg;</sup></p>
    <img width="50" src="assets/${img}.png" alt="">
</div>`;

    return card;
}

const createChart = () => {
    Chart.defaults.global.defaultFontFamily = "Poppins";
    let theme = document.documentElement.dataset.theme;
    let chart = new Chart("myChart", {
    type: "line",
    data: {
        labels: gl_xvalues,
        datasets: [{
            backgroundColor: "transparent",
            borderColor: theme == 'light' ? "black" : "white",
            data: gl_temp_y,
        }]
    },
    options: {
        legend: {display: false},
        responsive: true,
        scales: {
            yAxes: [{
            display: false,
            gridLines: {
                drawBorder: false,
                display: false,
            },
            }],
            xAxes: [{
            gridLines: {
                display: false,
                drawBorder: false,
            },
            ticks: {
                fontColor: theme == 'light' ? "black" : "white",
            }
            }],
        },
    }
    });
}

const kelvinToCelcius = (kelvin) => (kelvin - 273.15).toFixed(2);

const getWeather = (lat,lon) => {

    aside.innerHTML = `<h1>This Week</h1>`;

    let WEATHER_API = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    fetch(WEATHER_API).then((res => {
        res.json().then((data) => {
            let {main,weather,wind} = data;
            city_span.innerHTML = data.name;
            temp_span.innerHTML = `${(main.temp - 273.15).toFixed(2)}`;
            temp_desc.innerHTML = weather[0].description;

            wind_speed.children[2].innerHTML = `${(wind.speed * 18/5).toFixed(2)}km/h`;
            humidity.children[2].innerHTML = `${main.humidity}%`;
        })
    })).catch((err)=>{console.log(err)});

    const FORECAST_API = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=8&appid=${API_KEY}`;
    fetch(FORECAST_API).then((res => {
        res.json().then((data) => {
            console.log(data);
            let forecasts = data.list;
            let temp = forecasts[0].temp;
            console.log(forecasts[0]);
            let temp_y = [kelvinToCelcius(temp.morn),
                kelvinToCelcius(temp.day),kelvinToCelcius(temp.eve),kelvinToCelcius(temp.night)];
            const xValues = [["Morning",temp_y[0]],["Afternoon",temp_y[1]],["Evening",temp_y[2]],["Night",temp_y[3]]];

            gl_temp_y = temp_y;
            gl_xvalues = xValues;
            
            createChart();
            
            forecasts.forEach((e,i) => {
                let curr_date = new Date();
                let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                if(i != 0){
                    curr_date.setDate(curr_date.getDate() + i);
                    let day = i == 1 ? "Tommorow" : days[curr_date.getDay()];
                    let temp = e.temp.day;
                    let img = e.weather[0].icon;
                    let card = createForecastCard(day,curr_date.getDate(),months[curr_date.getMonth()],(temp - 273.15).toFixed(2),img);
                    aside.innerHTML += card;
                }
            })
        })
    }));
}

setInterval(()=>{
    let curr_time = new Date();
    time.innerHTML = `Today ${formatAMPM(curr_time)}`;
},1000)

window.onload = async () => {
    section.style.display = 'none';
    aside.innerHTML = "";
    let localStorage_theme = localStorage.getItem('weather-vine-theme');
    if(localStorage_theme != undefined && localStorage_theme != null){
        document.documentElement.dataset.theme = localStorage_theme;
        if(localStorage_theme == "dark")
            theme.checked = true;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;
        section.style.display = 'block';
        locationAccepted = true;
        getWeather(lat,lon);
    },(err) => {
        section.style.display = 'block';
        section.innerHTML = `<h1 style="font-size: 2.4rem;text-align: center; margin-top: 2rem;">
            Please enable location to see weather details and forecast.
        </h1>`;
        // aside.style.display = 'none';
        aside.innerHTML = `<h2 style="font-size: 2.4rem;text-align: center; margin-top: 2rem;">No data (location is denied)</h2>`;
    });
}

// Set default values
let sun = {};
sun.position = 90;

let moon = {};
moon.position = 90;
moon.phase = "Full Moon";










// Animation data
// Canvas
let canvas = {};

// Daytime/nighttime
let daytime = true;

// Island
let island = {};
island.heightOffset = 0;
island.speed = 10;
island.direction = true;
island.maxOffset = 10;
island.img = new Image();

// Sun
sun.circle = {};
sun.circle.angle = [];
sun.circle.angle[0] = 0;
sun.circle.angle[1] = 0;
sun.circle.angle[2] = 0;

sun.circle.radius = [];
sun.circle.radius[0] = 1;
sun.circle.radius[1] = 4;
sun.circle.radius[2] = 2;

sun.circle.size = [];
sun.circle.size[0] = 45;
sun.circle.size[1] = 43;
sun.circle.size[2] = 40;

sun.circle.color = [];
sun.circle.color[0] = "#f8db92ff";
sun.circle.color[1] = "#f4c854ff";
sun.circle.color[2] = "#f2be33ff";

sun.circle.speed = [];
sun.circle.speed[0] = 3;
sun.circle.speed[1] = 2;
sun.circle.speed[2] = 3;

sun.img = new Image();

// Moon
moon.img = new Image();
moon.circle = {};
moon.circle.minSize = 1;
moon.circle.size = moon.circle.minSize;
moon.circle.speed = 9;
moon.circle.direction = true;

// Arrow
let arrow = {};
arrow.img = new Image();
arrow.img.src = "assets/arrow.png";
arrow.imgR = new Image();
arrow.imgR.src = "assets/arrow-right.png";











// GET request to url
function getHttpRequest(url)
{
    const promise = new Promise((resolve, reject) => {

        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);

        xhr.responseType = "json";

        xhr.onload = () => {
            if (xhr.status >= 400)// which codes are error codes?
            {
                reject(xhr.response);
            }
            resolve(xhr.response);
        }

        xhr.onerror = () => {
            reject("couldn't access data");
        }
        
        xhr.send();

    });

    return promise;
}













// Convert position from percentage to degrees
function toDegrees(position)
{
    return ((position >= 0) ? (100 - (position * 100)) * (180 / 100) : (Math.abs(position * 100) * (180 / 100)) + 180); 
}




// Calculate and change position of Sun & Moon on the orbit
function calcPos(current, rise, set, lat, lon, body)
{
    let pos;
    if (current >= rise && current <= set)
    {
        pos = (current - rise) / (set - rise);
        pos = toDegrees(pos);
        eval(body).position = pos;
        return;
    }
    if (current <= rise && current >= set)
    {
        pos = (rise - current) / (rise - set);
        pos -= pos * 2;
        pos = toDegrees(pos);
        eval(body).position = pos;
        return;
    }

    let a; let b;
    if (current < rise && rise < set) { a = -1; b = "Set"; } // Get yesterday's set time
    else if (current > set && rise < set) { a = 1; b = "Rise"; } // Get tomorrow's rise time
    else if (current > rise && rise > set) { a = 1; b = "Set"; } // Get tomorrow's set time
    else if (current < set && rise > set) { a = -1; b = "Rise"; } // Get yesterday's rise time
    
    let day = new Date();
    day.setDate(day.getDate() + a);
    let dd = String(day.getDate()).padStart(2, "0");
    let mm = String(day.getMonth() + 1).padStart(2, "0");
    let yyyy = day.getFullYear();
    let url = "https://api.solunar.org/solunar/" + lat + "," + lon + "," + yyyy + mm + dd + ",0";

    getHttpRequest(url)
    .then(responseData => {
        let newInfo = Date.parse(mm + "/" + dd + "/" + yyyy + " " + responseData[body + b] + ":00") / 1000;
        
        if (a == -1 && b == "Set") { pos = (rise - current) / (rise - newInfo); pos -= pos * 2; }
        if (a == 1 && b == "Rise") { pos = (newInfo - current) / (newInfo - set); pos -= pos * 2; }
        if (a == 1 && b == "Set") { pos = (current - rise) / (newInfo - rise); }
        if (a == -1 && b == "Rise") { pos = (current - newInfo) / (set - newInfo); }
        pos = toDegrees(pos);
        eval(body).position = pos;
    })
    .catch(err => {
        console.log(err);
        alert("Couldn't get access to necessary data - check your internet connection");
    })
}





// Get today's Sun & Moon data
function dataToday(lat, lon)
{
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0");
    let yyyy = today.getFullYear();

    // Put together url depending on time and coordinates
    let url = "https://api.solunar.org/solunar/" + lat + "," + lon + "," + yyyy + mm + dd + ",0";

    getHttpRequest(url)
    .then(responseData => {

        // Set the moon phase
        moon.phase = responseData.moonPhase;

        // Unix timestamp
        let current = Date.parse(mm + "/" + dd + "/" + yyyy + " " + today.getUTCHours() + ":" + today.getUTCMinutes() + ":00") / 1000;
        let sunrise = Date.parse(mm + "/" + dd + "/" + yyyy + " " + responseData.sunRise + ":00") / 1000;
        let sunset = Date.parse(mm + "/" + dd + "/" + yyyy + " " + responseData.sunSet + ":00") / 1000;
        let moonrise = Date.parse(mm + "/" + dd + "/" + yyyy + " " + responseData.moonRise + ":00") / 1000;
        let moonset = Date.parse(mm + "/" + dd + "/" + yyyy + " " + responseData.moonSet + ":00") / 1000;

        if (isNaN(sunrise)) { sunrise = (current > sunrise) ? (sunset - 1) : (sunset + 1); }
        if (isNaN(sunset)) { sunset = (current > sunrise) ? (sunrise - 1) : (sunrise + 1); }
        if (isNaN(moonrise)) { moonrise = (current > moonset) ? (moonset - 1) : (moonset + 1); }
        if (isNaN(moonset)) { moonset = (current > moonrise) ? (moonrise - 1) : (moonrise + 1); }
        
        calcPos(current, sunrise, sunset, lat, lon, "sun");
        calcPos(current, moonrise, moonset, lat, lon, "moon");
    })
    .catch(err => {
        console.log(err);
        alert("Couldn't get access to necessary data - check your internet connection");
    })
}











window.onload = function() {

    // Get latitude and longitude values from url
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let latitude = urlParams.get('lat');
    let longitude = urlParams.get('lon');

    if (latitude != null && longitude != null)
    {

        // Every interval change the calculate current position of Sun & Moon
        dataToday(latitude, longitude);
        let interval = 300000;

        setInterval(() => {

            dataToday(latitude, longitude);

        }, interval)
    }

    

    






    canvas.width = document.getElementById("canvas").offsetWidth;
    canvas.height = document.getElementById("canvas").offsetHeight;

    let count = 0;

    // Animation
    setInterval(() => {
        animate();

        // Island
        if (count % island.speed == 0)
        {
            island.heightOffset = island.direction ? island.heightOffset + 1 : island.heightOffset - 1;
            if (Math.abs(island.heightOffset) == island.maxOffset) { island.direction = !(island.heightOffset > 0); }
        }

        // Sun circles
        for (let i in sun.circle.speed)
        {
            if (count % sun.circle.speed[i] == 0)
            {
                sun.circle.angle[i]++;

                if (sun.circle.angle[i] == 360)
                {
                    sun.circle.angle[i] = 0;
                }
            }
        }

        // Moon circle
        if (count % moon.circle.speed == 0)
        {
            moon.circle.size = moon.circle.direction ? moon.circle.size + 1 : moon.circle.size - 1;
            if (moon.circle.size >= moon.circle.maxSize) { moon.circle.direction = false; }
            if (moon.circle.size == moon.circle.minSize) { moon.circle.direction = true; }
        }




        count++;
        if (count == 100000) { count = 0; }

    }, 10);
}



















































//////////////////////////////////////////////////////////////////

// Draw point on orbit
function drawPoint(angle, radius, pointSize, centerX, centerY, color){

    let x = centerX + radius * Math.cos(-angle*Math.PI/180);
    let y = centerY + radius * Math.sin(-angle*Math.PI/180);

    let c = document.getElementById("canvas");
    let ctx = c.getContext("2d");

    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}















// Animate
function animate()
{
    // Clear screen
    let c = document.getElementById("canvas");
    let ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 1600, 800);

    daytime = (sun.position <= 180);

    // Paint background
    let skyColor = daytime ? "#80b0fbff" : "#001849ff";
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);    
    document.getElementsByTagName("BODY")[0].style.backgroundColor = skyColor;

    // Island
    island.img.src = daytime ? "assets/island.png" : "assets/island-night.png";
    island.height = canvas.height / 3;
    island.width = island.height * 0.65373134328;
    ctx.drawImage(island.img, (canvas.width / 2) - (island.width / 2), (canvas.height / 2) - (island.height / 2) + island.heightOffset, island.width, island.height);


    // Orbits
    sun.orbit = canvas.height / 2.7;
    moon.orbit = canvas.height / 4;

    ctx.setLineDash([5, 3]);
    ctx.lineWidth = canvas.height / 1000;
    ctx.strokeStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc((canvas.width / 2), (canvas.height / 2), sun.orbit, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc((canvas.width / 2), (canvas.height / 2), moon.orbit, 0, 2 * Math.PI);
    ctx.stroke();


    // Sun
    sun.x = (canvas.width / 2) + sun.orbit * Math.cos(-sun.position*Math.PI/180);
    sun.y = (canvas.height / 2) + sun.orbit * Math.sin(-sun.position*Math.PI/180);

    for (let i in sun.circle.angle)
    {
        drawPoint(sun.circle.angle[i], sun.circle.radius[i], sun.circle.size[i], sun.x, sun.y, sun.circle.color[i]);
    }


    sun.img.src = daytime ? "assets/sunface.png" : "assets/sunface-night.png";
    sun.height = canvas.height / 23;
    sun.width = daytime ? sun.height * 1.66666666667 : sun.height * 1.92307692308;
    ctx.drawImage(sun.img, (canvas.width / 2) + sun.orbit * Math.cos(-sun.position*Math.PI/180) - (sun.width / 2), (canvas.height / 2) + sun.orbit * Math.sin(-sun.position*Math.PI/180) - (sun.height / 2) + 7, sun.width, sun.height);
    

    // Moon
    moon.circle.maxSize = Math.round(canvas.height / 33);
    moon.circle.color = daytime ? "#e9e9e939" : "#e9e9e91b";
    drawPoint(moon.position, moon.orbit, moon.circle.size, (canvas.width / 2), (canvas.height / 2), moon.circle.color);

    moon.img.src = "assets/" + moon.phase + ".png";
    moon.height = canvas.height / 25;
    moon.width = moon.height;
    ctx.drawImage(moon.img, (canvas.width / 2) + moon.orbit * Math.cos(-moon.position*Math.PI/180) - (moon.width / 2), (canvas.height / 2) + moon.orbit * Math.sin(-moon.position*Math.PI/180) - (moon.height / 2), moon.width, moon.height);



    // Arrows
    arrow.height = canvas.height / 35;
    arrow.width = arrow.height * 0.816666667;
    arrow.offset = canvas.height / 10;
    ctx.drawImage(arrow.img, ((canvas.width / 2) + sun.orbit * Math.cos(-180*Math.PI/180)) - arrow.offset - arrow.width, (canvas.height / 2), arrow.width, arrow.height);
    ctx.drawImage(arrow.imgR, ((canvas.width / 2) + sun.orbit * Math.cos(-0*Math.PI/180)) + arrow.offset, (canvas.height / 2), arrow.width, arrow.height);

}
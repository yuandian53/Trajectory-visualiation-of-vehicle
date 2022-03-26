//para setting-----------------------------------------------------------
const tloader = new THREE.FontLoader();
const dis_2road = 40; //the distance of each two roads
const road_num = 2;
const lane_num = 3; //the num of lane about one direction
const zlen = 3.5; //width 0f road
var uuid = [];
var mixers = [];
var group = new THREE.Group();
var data;
var idset = [];
var clock = new THREE.Clock();
var line = [];
var temp_line = [] //temp list serve as a buffer
var pos = []; //list of positon
var col = []; //list of color 
var camera, scene, controls, renderer, mouse = new THREE.Vector2(),
    stats, loader, light, carList = [],
    manager = new THREE.LoadingManager(),
    loader = new THREE.GLTFLoader(manager);
//------------------------------------------------------------------------

//csv data pre-process-----------------------------------------------------
function csvToObject(csvString) {
    var csvarry = csvString.split("\r\n");
    var datas = [];
    var headers = csvarry[0].split(",");
    for (var i = 1; i < csvarry.length; i++) {
        var data = {};
        var temp = csvarry[i].split(",");
        for (var j = 0; j < temp.length; j++) {
            data[headers[j]] = temp[j];
        }
        datas.push(data);
    }
    return datas;
}

function FuncCSVInport() {
    $("#csvFileInput").val("");
    $("#csvFileInput").click();
}

function readCSVFile(obj) {
    var reader = new FileReader();
    reader.readAsText(obj.files[0]);
    reader.onload = function() {
        var tdata = csvToObject(this.result);
        data = tdata;
        console.log(data);

    }
}

function sorttime(a, b) {
    return a.time - b.time
}

function pre(data) {
    len = data.length;
    for (var i = 0; i < len; i++) {
        idset.push(data[i].ID);
    }
    idset = unique(idset);
    return idset;
}

function unique(arr) {
    //Set
    return Array.from(new Set(arr));
}

function getcolumn(name, arr) {
    var ret = []
    for (var i = 0, len = arr.length; i < len; i++) {
        ret.push(arr[i][name])
    }
    return ret
}
//--------------------------------------------------------------------------

//init sub-function---------------------------------------------------------
function initCity() { //init function of 3D models and animation(keyframe based on three.js)

    // Scene settings
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7E8B92);
    scene.fog = new THREE.Fog(new THREE.Color(0x000000), 200, 300);

    // Camera settings
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 5, 2000);
    camera.position.set(-200, 30, 0);
    //controls = new THREE.MapControls(camera);
    // Lights
    light = new THREE.DirectionalLight(0x9a9a9a, 1);
    light.position.set(-300, 1000, -300);
    light.castShadow = true;
    light.shadow.mapSize.width = light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 1000;
    light.shadow.camera.left = light.shadow.camera.bottom = -200;
    light.shadow.camera.right = light.shadow.camera.top = 200;
    scene.add(light);
    hemiLight = new THREE.HemisphereLight(0xefefef, 0xffffff, 1);
    hemiLight.positon = (-500, 100, 0);
    scene.add(hemiLight);

    // Renderer settings
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('canvas'), antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.position = 'absolute';
    renderer.gammaInput = renderer.gammaOutput = true;
    renderer.gammaFactor = 2.0;
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls = new THREE.MapControls(camera, renderer.domElement);

    //Events
    window.addEventListener("resize", onResize, false);
    window.addEventListener("mousemove", onMouseMove, false);
    /////init


}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    render();
    //console.log(camera.position.y);
}

function render() {
    // stats.begin();
    controls.update();
    // stats.end();
    renderer.render(scene, camera);
    var clk = clock.getDelta();
    mixers.forEach(function(mixer) {
        mixer.update(clk);
    });
    document.getElementById("output").appendChild(renderer.domElement);
    for (var i = 0; i < temp_line.length; i++) {
        scene.remove(temp_line[i]);
    }
    for (var i = 0; i < carList.length; i++) {
        if (carList[i].position.y > 0) {
            line[i].push(new THREE.Vector3(carList[i].position.x, 0.1, carList[i].position.z))
            line[i].shift();
            ///////////////////////////////////
            var geometry = new THREE.Geometry();
            var curve = new THREE.CatmullRomCurve3(line[i]);
            var points = curve.getPoints(100);
            geometry.setFromPoints(points);
            var material = new THREE.LineBasicMaterial({
                color: carList[i].material.color,
                linewidth: 15
            });
            material.resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
            var line2 = new THREE.Line(geometry, material);
            line2.computeLineDistances();
            var line3 = line2.clone();
            var line4 = line2.clone();
            var line5 = line2.clone();
            line3.position.z += 1.4;
            line4.position.z += 1.3;
            line5.position.z -= 1.3;
            line2.position.z -= 1.4;
            scene.add(line3, line4, line5);
            scene.add(line2); //线条对象添加到场景中
            temp_line.push(line2);
            temp_line.push(line3);
            temp_line.push(line4);
            temp_line.push(line5);

        }
    }
}

function addroad() {
    for (var k = 0; k < road_num; k++) {
        for (var i = 1; i <= lane_num - 1; i++) {
            addline(zlen * i + k * dis_2road, 0xFFFFFF, 2);
            addline(-zlen * i + k * dis_2road, 0xFFFFFF, 2);
        }
        addline(0 + k * dis_2road, 0xffa500, 1);
        addline(-0.05 + k * dis_2road, 0xffa500, 1);
        addline(0.05 + k * dis_2road, 0xffa500, 1);
        addline(-0.1 + k * dis_2road, 0xffa500, 1);
        addline(0.1 + k * dis_2road, 0xffa500, 1);
        ////////////////////////////
        // addplain(0);
        addplain(k * dis_2road);
    }
};

function addline(z, color, type) {
    if (type == 1) {
        geometry = new THREE.Geometry();
        geometry.vertices.push(
            new THREE.Vector3(0, 0.1, z),
            new THREE.Vector3(-1000, 0.1, z)
        );
        geometry.colors.push(
            new THREE.Color(color),
            new THREE.Color(color)
        )
        material = new THREE.LineBasicMaterial({ vertexColors: true });
        var line = new THREE.Line(geometry, material);
        scene.add(line);
    }

    /////////////////	
    if (type == 2) {
        var lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(new THREE.Vector3(0, 0.1, z));
        lineGeometry.vertices.push(new THREE.Vector3(-1000, 0.1, z));

        var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({
            color: color,
            dashSize: 1,
            gapSize: 3
        }));
        line.computeLineDistances();
        scene.add(line);
    }
}

function addplain(posz) {
    var material1 = new THREE.MeshPhongMaterial({
        color: 0x000000
    });
    var geometry1 = new THREE.CubeGeometry(24, 1, 800);
    var e = new THREE.Mesh(geometry1, material1);
    e.position.set(-400, -0.5, posz);
    e.rotation.y = Math.PI / 2;
    scene.add(e)

}

function addtext(ID) {
    var t0;
    tloader.load('./gentilis_regular.typeface.json', function(font) {

        const text = new THREE.TextGeometry(ID, {
            font: font,
            size: 1,
            height: 0.1,
        });
        var material1 = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        t0 = new THREE.Mesh(text, material1);
    });
    return t0;
}

function addcar(x, z, ID, type) {
    var id;
    if (ID > 999) {
        id = ID - 1000;
    } else {
        id = ID;
    }
    var geometry = new THREE.Geometry();
    var material1 = new THREE.MeshPhongMaterial({
        color: 0xff0000
    });
    tloader.load('./gentilis_regular.typeface.json', function(font) {
        const text = new THREE.TextGeometry("ID:" + id, {
            font: font,
            size: 2,
            height: 0.1,
        });
        var material1 = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        var t0 = new THREE.Mesh(text, material1);
        var material1 = new THREE.MeshPhongMaterial({
            color: 0x000000
        });
        var geometry1 = new THREE.CubeGeometry(2.8, 3, 8);
        var cube2 = new THREE.Mesh(geometry1, material1);
        cube2.updateMatrix();
        geometry.merge(cube2.geometry, cube2.matrix);
        var cube3 = t0;
        cube3.position.y += 5;
        cube3.rotation.y = -Math.PI / 2;
        cube3.updateMatrix();
        geometry.merge(cube3.geometry, cube3.matrix);
    });
    var e = new THREE.Mesh(geometry, material1);
    e.name = ID;
    e.position.set(x, 2, z);
    e.rotation.y = Math.PI / 2;
    uuid.push(e.uuid);
    group.add(e);
    scene.add(e);
    carList.push(e);
    console.log("car coming");
};
//-----------------------------------------------------------------------------

//main function ---------------------------------------------------------------

var times = []; //length of simulation time 

function option1() { //init models and format data for animation
    initCity();
    var city = new THREEx.ProceduralCity();
    scene.add(city);
    window.alert("wait a moment");
    var idset = [];
    idset = pre(data);
    idset.pop();
    addroad();
    for (var i = 0; i < idset.length; i++) {
        var temp = data.filter(function checkAdult(age) { return age.ID == idset[i]; })
        temp.sort(sorttime);
        var Type = 1;
        if (temp[0] != undefined) {
            Type = temp[0].type;
        }
        addcar(0, 0, idset[i], Type);
        //get the time of each animation
        var temptime = [];
        temptime = getcolumn('time', temp);
        var position = [];
        var color = [];
        for (var k = 0; k < temptime.length; k++) {
            position.push(0);
            position.push(1);
            position.push(0);
            color.push(1);
            color.push(1);
            color.push(1);
            if (k < temp.length) {
                if (temp[k] != undefined) {
                    console.log("----")
                    if (temp[k].type == 1) {
                        position[3 * k] = temp[k].x - 250;
                        position[3 * k + 2] = -temp[k].z;
                        if (temp[k].color == 2) {
                            position[3 * k + 1] = -5;
                        }
                    } else {
                        if (temp[k].color == 1) {
                            color[3 * k] = 1;
                            color[3 * k + 1] = 0;
                            color[3 * k + 2] = 0;
                        }
                        position[3 * k] = temp[k].x - 250;
                        position[3 * k + 2] = -temp[k].z + dis_2road;
                    }

                } else {}
            }
        }
        position.unshift(0, -500, 0);
        position.push(0, -500, 0);
        color.unshift(0, 0, 0);
        color.push(0, 0, 0);
        var mint = temptime[0] - 0.1;
        var maxt1 = temptime.slice(-1);
        var maxt = maxt1[0];
        temptime.unshift(mint);
        temptime.push(maxt);
        times.push(temptime);
        pos.push(position);
        col.push(color);
    }
    tloader.load('./gentilis_regular.typeface.json', function(font) {
        const text = new THREE.TextGeometry("Raw Data", {
            font: font,
            size: 2,
            height: 0.1,
        });
        var material1 = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        var t0 = new THREE.Mesh(text, material1);
        t0.position.set(-130, 10, -5);
        scene.add(t0);
    });
    tloader.load('./gentilis_regular.typeface.json', function(font) {
        const text = new THREE.TextGeometry("Result", {
            font: font,
            size: 2,
            height: 0.1,
        });
        var material1 = new THREE.MeshPhongMaterial({
            color: 0xff0000
        });
        var t0 = new THREE.Mesh(text, material1);
        t0.position.set(-130, 10, -5 + dis_2road);
        scene.add(t0);
    });
    for (var i = 0; i < carList.length; i++) {
        line.push([new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -1, 0)
        ]);
    }

    setTimeout(delay, 2000); //the interval between data import and animation start.(more data,bigger interval)

}

function delay() { //create key frame animation after data formatted 
    var trackset = [];
    for (var i = 0; i < idset.length; i++) {
        var Track = [];
        var posTrack = new THREE.KeyframeTrack(uuid[i] + '.position', times[i], pos[i]);
        var colTrack = new THREE.ColorKeyframeTrack(uuid[i] + '.material.color', times[i], col[i]);
        Track.push(posTrack);
        Track.push(colTrack);
        trackset.push(Track);
    }
    var clips = [];
    for (var i = 0; i < idset.length; i++) {
        var duration = 500;
        var clip = new THREE.AnimationClip(uuid[i] + "default", duration, trackset[i]);
        var blank = [];
        var mixer = new THREE.AnimationMixer(carList[i]);
        mixers.push(mixer);
        clips.push(clip);
    }
    for (var i = 0; i < mixers.length; i++) {
        if (1) {
            mixers[i].clipAction(clips[i]).loop = THREE.LoopOnce;
            mixers[i].clipAction(clips[i]).timeScale = 1;
            //mixers[i].clipAction(clips2[i]).loop = THREE.LoopOnce;
            mixers[i].clipAction(clips[i]).play();
        }
    }
    animate();
}
//-----------------------------------------------------------------------------
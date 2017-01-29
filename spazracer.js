'use strict';

var scene, camera, renderer;
var geometry, material, mesh;
var point_light;
var hemi_light;

var plane_geo, plane_mat, plane_mesh;
var pl1, pl2, pl3, pl4;

var box_size = 200;
var plane_size = 15000;
var speed = 100;
var rot_speed = 0.08;

var camera_pos, camera_pos_dest;

var enemies;
var spatiomap;
var grid_cells = 10;
var grid_width = plane_size / grid_cells;

var bg_color = new THREE.Color(0, 0, 0);
var bg_t0 = 0;

var powerup;
var powered_up = false;
var power_scale = 10;
var power_time_tot = 10;
var power_t0;

var n_enemies = 100;
var enemies_left = n_enemies;

var muted = true;
var musak;
var truck_noise;
var splod_noise;

var started = false;
var finished= false;
var score_start = 120 * 1000;
var score_t0;


function position_to_cell(x, y, z) {
    var min_plane = -plane_size / 2;
    var x_ind = Math.floor((x - min_plane) / grid_width);
    var z_ind = Math.floor((z - min_plane) / grid_width);
    return grid_cells * z_ind + x_ind;
}

function all_cells(x, y, z, scale) {
    if (!scale) scale = 1.0;
    var minx = x - scale * box_size / 2.0;
    var maxx = x + scale * box_size / 2.0;
    var minz = z - scale * box_size / 2.0;
    var maxz = z + scale * box_size / 2.0;

    var min_plane = -plane_size / 2;
    var max_plane = plane_size / 2;
    var cells = new Set();
    if (minx > min_plane && minz > min_plane) cells.add(position_to_cell(minx, 0, minz));
    if (minx > min_plane && maxz < max_plane) cells.add(position_to_cell(minx, 0, maxz));
    if (maxx < max_plane && maxz < max_plane) cells.add(position_to_cell(maxx, 0, maxz));
    if (maxx < max_plane && minz > min_plane) cells.add(position_to_cell(maxx, 0, minz));
    cells = Array.from(cells);
    return cells;
}

function is_colliding(mesh1, mesh2, scale1, scale2) {
    if (!scale1) scale1 = 1.0;
    if (!scale2) scale2 = 1.0;
    var minx1 = mesh1.position.x - scale1 * box_size / 2.0;
    var maxx1 = mesh1.position.x + scale1 * box_size / 2.0;
    var minz1 = mesh1.position.z - scale1 * box_size / 2.0;
    var maxz1 = mesh1.position.z + scale1 * box_size / 2.0;

    var minx2 = mesh2.position.x - scale2 * box_size / 2.0;
    var maxx2 = mesh2.position.x + scale2 * box_size / 2.0;
    var minz2 = mesh2.position.z - scale2 * box_size / 2.0;
    var maxz2 = mesh2.position.z + scale2 * box_size / 2.0;

    return minx1 < maxx2 && maxx1 > minx2 && minz1 < maxz2 && maxz1 > minz2;
}

var Key = {
    _pressed: {},

    M: 77,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    isDown: function (keyCode) {
        return this._pressed[keyCode];
    },

    onKeydown: function (event) {
        this._pressed[event.keyCode] = true;
    },

    onKeyup: function (event) {
        if (event.keyCode == Key.M) {
            if (muted) {
                document.getElementById('mute-info').innerHTML = '';
            } else {
                document.getElementById('mute-info').innerHTML = 'Press M to un-mute';
            }
            muted = !muted;
        }
        delete this._pressed[event.keyCode];
    }
};


init();
keyboard();
animate(1);

function keyboard() {
    window.addEventListener('keyup', function (event) {
        Key.onKeyup(event);
    }, false);
    window.addEventListener('keydown', function (event) {
        Key.onKeydown(event);
    }, false);
}

function init() {
    scene = new THREE.Scene();
    scene.background = bg_color;

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.y = 400;
    camera.position.z = 1000;

    geometry = new THREE.BoxGeometry(box_size, box_size, box_size);
    material = new THREE.MeshLambertMaterial({color: 0xD43001});
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = box_size / 2;
    camera.lookAt(mesh.position);
    scene.add(mesh);

    point_light = new THREE.PointLight(0xF0F0F0);
    point_light.position.z = 0;
    point_light.position.x = 0;
    point_light.position.y = 1000;
    point_light.intensity = 1;
    point_light.distance = plane_size / 2;
    scene.add(point_light);

    pl1 = new THREE.PointLight(0xF0F0F0);
    pl1.position.y = 1000;
    pl1.position.z = -0.3 * plane_size;
    pl1.position.x = -0.3 * plane_size;
    pl1.distance = plane_size / 2;
    pl1.intensity = 1;
    scene.add(pl1);
    pl2 = new THREE.PointLight(0xF0F0F0);
    pl2.position.y = 1000;
    pl2.position.z = -0.3 * plane_size;
    pl2.position.x = 0.3 * plane_size;
    pl2.distance = plane_size / 2;
    pl2.intensity = 1;
    scene.add(pl2);
    pl3 = new THREE.PointLight(0xF0F0F0);
    pl3.position.y = 1000;
    pl3.position.z = 0.3 * plane_size;
    pl3.position.x = 0.3 * plane_size;
    pl3.distance = plane_size / 2;
    pl3.intensity = 1;
    scene.add(pl3);
    pl4 = new THREE.PointLight(0xF0F0F0);
    pl4.position.y = 1000;
    pl4.position.z = 0.3 * plane_size;
    pl4.position.x = -0.3 * plane_size;
    pl4.distance = plane_size / 2;
    pl4.intensity = 1;
    scene.add(pl4);

    hemi_light = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    scene.add(hemi_light);

    plane_geo = new THREE.PlaneGeometry(plane_size, plane_size, 10, 10);
    plane_mat = new THREE.MeshLambertMaterial({color: 0x0BD121});
    //plane_mat.wireframe = true;
    plane_mesh = new THREE.Mesh(plane_geo, plane_mat);
    plane_mesh.rotation.x = -Math.PI / 2;
    scene.add(plane_mesh);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(0.95 * window.innerWidth, 0.95 * window.innerHeight);

    // Make this a vector we'll fill in later.
    camera_pos = new THREE.Vector3();

    // Initialize our spatio-hash map for collision checking.
    // Will contain lists of candidate objects
    spatiomap = [];
    for (var i = 0; i < grid_cells * grid_cells; i++) {
        spatiomap.push([]);
    }

    // Make enemies and register them in our spatio-hash map
    enemies = [];
    for (i = 0; i < n_enemies; i++) {
        // Random boxes
        var e_geo = new THREE.BoxGeometry(box_size, 2 * box_size, box_size);
        var e_mat = new THREE.MeshLambertMaterial({color: 0x3300DD});
        var e_mesh = new THREE.Mesh(e_geo, e_mat);
        var ps = plane_size - box_size;
        e_mesh.position.x = Math.floor(Math.random() * ps - ps / 2.0);
        e_mesh.position.z = Math.floor(Math.random() * ps - ps / 2.0);
        e_mesh.position.y = box_size * 2 / 2;

        // Find the cells they're in
        var cells = all_cells(e_mesh.position.x, e_mesh.position.y, e_mesh.position.z);
        for (var j = 0; j < cells.length; j++) {
            spatiomap[cells[j]].push(e_mesh);
        }
        enemies.push(e_mesh);
        scene.add(e_mesh);
    }
    powerup = enemies[Math.floor(Math.random() * n_enemies)];
    powerup.material.color.setRGB(0.9, 0.9, 0.9);

    var container = document.getElementById('canvas');
    container.appendChild(renderer.domElement);
    document.getElementById('enemies_left').innerHTML = 'Enemies left: ' + enemies_left;

    var listener = new THREE.AudioListener();
    camera.add(listener);

    musak = new THREE.Audio(listener);
    var audioLoader = new THREE.AudioLoader();
    audioLoader.load('hstar.ogg', function (buffer) {
        musak.setBuffer(buffer);
        musak.setLoop(true);
        document.getElementById('loading-info').innerHTML = '';
        musak.play();
    });

    truck_noise = new THREE.Audio(listener);
    var audio_loader_tn = new THREE.AudioLoader();
    audio_loader_tn.load('truck.ogg', function (buffer) {
        truck_noise.setBuffer(buffer);
        truck_noise.setLoop(true);
    });

    splod_noise = new THREE.Audio(listener);
    var audio_loader_sp = new THREE.AudioLoader();
    audio_loader_sp.load('splod.ogg', function (buffer) {
        splod_noise.setBuffer(buffer);
        splod_noise.setLoop(false);
    })

}

function start_me_up(time) {
    if (!started) {
        started = true;
        score_t0 = time;
    }
}

function animate(time) {
    requestAnimationFrame(animate);
    var scale = powered_up ? power_scale : 1;

    var score;
    if (started) {
        if(finished){
            score = score_start;
        }else {
            score = score_start - (time - score_t0);
        }
    } else {
        score = score_start;
    }
    document.getElementById('score').innerHTML = 'Score: ' + Math.floor(score / 1000);

    if (powered_up) {
        var power_t = time - power_t0;
        var power_time_left = 1000 * power_time_tot - power_t;
        document.querySelector('#powerup_left').innerHTML = 'Power cube time remaining: ' + Math.floor(power_time_left / 1000);

        if (power_time_left < 0) {
            powered_up = false;
            camera.far /= power_scale;
            camera.updateProjectionMatrix();
            mesh.scale.set(1, 1, 1);
            mesh.position.y = box_size / 2;
            document.querySelector('#powerup_left').innerHTML = '';
        }
    }

    if (!started) {
        bg_color.setRGB(0.9, 0.9, 0.9);
    } else {
        if (Key.isDown(Key.DOWN)) {
            bg_color.setRGB(1, 0, 0);
        } else {
            var bg_dt = time - bg_t0;
            if (bg_dt > 80) {
                bg_t0 = time;
                bg_color.setHSL(Math.random(), Math.random() / 2 + 0.5, 0.5);
            }
        }
    }

    //e_mesh.position.x = Math.floor(Math.random() * ps - ps / 2.0);
    //scene.background = bg_color;
    //bg_color.setHSL(0.9, Math.random(), Math.random());

    if (muted) {
        musak.setVolume(0.0);
        truck_noise.setVolume(0.0);
        splod_noise.setVolume(0.0);
    } else {
        musak.setVolume(1.0);
        truck_noise.setVolume(1.0);
        splod_noise.setVolume(0.3);
    }

    // Do keyboard
    if (Key.isDown(Key.UP)) {
        mesh.translateZ(-speed);
        start_me_up(time);
    }
    if (Key.isDown(Key.DOWN)) {
        start_me_up(time);
        mesh.translateZ(speed / 10.0);
        musak.setVolume(0.0);
        if (!truck_noise.isPlaying) {
            truck_noise.play();
        }
    } else {
        if (truck_noise.isPlaying) {
            truck_noise.stop();
        }
    }

    if (Key.isDown(Key.LEFT)) {
        start_me_up(time);
        mesh.rotation.y += rot_speed;
    }
    if (Key.isDown(Key.RIGHT)) {
        start_me_up(time);
        mesh.rotation.y -= rot_speed;
    }

    // Check for falling off map
    var max_plane = plane_size / 2;
    var min_plane = -plane_size / 2;
    if (mesh.position.x > max_plane) {
        mesh.position.x = 0;
        mesh.position.z = 0
    }
    if (mesh.position.x < min_plane) {
        mesh.position.x = 0;
        mesh.position.z = 0
    }
    if (mesh.position.z > max_plane) {
        mesh.position.x = 0;
        mesh.position.z = 0
    }
    if (mesh.position.z < min_plane) {
        mesh.position.x = 0;
        mesh.position.z = 0
    }

    if(finished){
        mesh.position.y += 15;
        mesh.rotation.z += 0.2;
    }

    // Find the cells we're in and do precision collision checking
    var cells = all_cells(mesh.position.x, mesh.position.y, mesh.position.z, scale);
    for (var i = 0; i < cells.length; i++) {
        var sm = spatiomap[cells[i]];
        for (var j = 0; j < sm.length; j++) {
            if (is_colliding(mesh, sm[j], scale)) {
                //console.log("colliding " + sm[j].uuid);
                if (sm[j].visible) {
                    if (splod_noise.isPlaying) {
                        splod_noise.stop();
                    }
                    splod_noise.play();
                    enemies_left--;
                    document.querySelector('#enemies_left').innerHTML = 'Enemies left: ' + enemies_left;
                    if (sm[j] == powerup) {
                        powered_up = true;
                        mesh.scale.set(power_scale, power_scale, power_scale);
                        mesh.position.y = power_scale * box_size / 2;
                        camera.far *= power_scale;
                        camera.updateProjectionMatrix();

                        // seconds -> ms
                        power_t0 = time;
                    }

                    if (enemies_left == 0) {
                        document.getElementById('win').style.display = 'block';
                        finished = true;
                        score_start = score_start - (time - score_t0);
                    }
                }
                sm[j].visible = false;
                sm.splice(j, 1);
                j--;
            }
        }
    }

    // Interpolate camera to where we want it to be (behind player)
    camera_pos_dest = new THREE.Vector3(0, 400, 1000);
    mesh.localToWorld(camera_pos_dest);
    camera_pos.lerpVectors(camera.position, camera_pos_dest, 0.2);
    camera.position.set(camera_pos.x, camera_pos.y, camera_pos.z);
    camera.lookAt(mesh.position);
    renderer.render(scene, camera);
}
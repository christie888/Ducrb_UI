var api_control = 'http://172.31.8.129/tes/1.0/control.json';
var api_air_conditioner = 'http://172.31.8.129/api/v1/air_conditioners';
var api_smartmeter = 'http://172.31.8.129/api/v1/smartmeter';
var api_filter = 'http://172.31.8.129/tes/1.0/filter.json';


var air_conditioner = {
    'id': "",
    'setting_bit': "",
    'on_off': "",
    'operation_mode': "",
    'ventilation_mode': "",
    'ventilation_amount': "",
    'set_point': "",
    'fan_speed': "",
    'fan_direction': "",
    'filter_sign_reset': ""
};

var total_on_off = 0

function getRoomContext(room_para, room_name) {

    var sensors = room_para[room_name]["sensor"][0]
    var light_ucode = room_para[room_name]["light"];
    var power_ucode = room_para[room_name]["power"]
    var light = getRoomLight(light_ucode);
    var humi = getHumi(room_name, sensors["humidity"]);
    var power = getPower(power_ucode);
    var temp = getTem(room_name, sensors["temperature"]);

    getRoomAir(room_para[room_name]["air"])

    setRoomTemperature(temp)
    setRoomLight(light);
    setRoomHumi(humi);
    setRoomPower(power);

    data = {"air_conditioner_status": air_conditioner}
    return data
}

function getRoomLight(light_ucode) {
    $.ajax({
        type: 'GET',
        url: api_filter + '?ucode=' + light_ucode,
        dataType: 'json',
        success: function (data) {
            //var object = eval("("+data+")");
            //$.each(data.list, function (index, item) {
            // alert(item.trueName);
            //})
            //data = "1"
            data = data[0][0]["data"][0]["instance"]
            console.log("light is" + data)

            setRoomLight(data);
            return data;
        }
    })


}

function getRoomAir(air_ids) {
    for (var i = 0; i < air_ids.length; i++) {
        air_id = air_ids[i]
        $.ajax({
            type: 'POST',
            url: "/air_get",
            data: JSON.stringify({
                air_id: air_id,
            }),
            contentType: 'application/json',
            success: function (response) {
                if (response.on_off == 1) {
                    total_on_off = response.on_off
                }
                response.on_off = total_on_off
                setRoomAir(response)
            }
        });
    }

}

function air_control_fan(air_id, fan) {
    $.ajax({
        type: 'POST',
        url: "/air_fan_setting",
        data: JSON.stringify({
            ucode: air_id[0],
            fan: fan
        }),
        contentType: 'application/json',
        success: function (response) {
            //console.log("set air con fan::" + ". to value:" + response)
            var lang = "ja"
            switch (response.fan_speed) {
                case 0:
                    if (lang == 'ja') {
                        $('#fan_speed').text('弱');
                    } else {
                        $('#fan_speed').text('Low');
                    }
                    break;

                case 1:
                    if (lang == 'ja') {
                        $('#fan_speed').text('中');
                    } else {
                        $('#fan_speed').text('Medium');
                    }
                    break;

                case 2:
                    if (lang == 'ja') {
                        $('#fan_speed').text('強');
                    } else {
                        $('#fan_speed').text('High');
                    }
                    break;
            }
        }
    });
}

function air_control_temp(air_id, temp) {
    $.ajax({
        type: 'POST',
        url: "/air_control_temp",
        data: JSON.stringify({
            ucode: air_id[0],
            temp: temp
        }),
        contentType: 'application/json',
        success: function (response) {
            $('#set_temp').text(response.set_point + '℃');
        }
    });
}


function setRoomTemperature(temp) {
    $("p#temperature").text(temp);
}


function light_control(light_id, value) {
    $.ajax({
        type: 'POST',
        url: "/api_control",
        data: JSON.stringify({
            ucode: light_id,
            instance: value
        }),
        contentType: 'application/json',
        success: function (response) {
            console.log("successed!!!!!")
        }
    });
    setRoomLight(value);

}

function air_control_on_off(ids, value) {
    for (var i = 0; i < ids.length; i++) {
        console.log("air control on_off" + ids[i])
        air_id = ids[i]
        $.ajax({
            type: 'POST',
            url: "/air_control",
            data: JSON.stringify({
                ucode: air_id,
                on_off: value
            }),
            contentType: 'application/json',
            success: function (response) {
                console.log(response)
            }
        });
    }
}


function setRoomLight(light) {
    if (light == "1") {
        $('#room-light-on').attr('src', '../static/images/room-light-on-1.png');
        $('#room-light-off').attr('src', '../static/images/room-light-off-0.png');
    } else {
        $('#room-light-on').attr('src', '../static/images/room-light-on-0.png');
        $('#room-light-off').attr('src', '../static/images/room-light-off-1.png');
    }
}

function setRoomAir(air_conditioner) {
    if (air_conditioner.on_off > 0) {
        $('#room-air-on').attr('src', '../static/images/room-air-on-1.png');
        $('#room-air-off').attr('src', '../static/images/room-air-off-0.png');
    } else {
        $('#room-air-on').attr('src', '../static/images/room-air-on-0.png');
        $('#room-air-off').attr('src', '../static/images/room-air-off-1.png');
    }
    switch (air_conditioner.operation_mode) {
        case 0x04:
            $('#room-air-select-cool').attr('src', '../static/images/room-air-select-1.png');
            $('#room-air-select-heat').attr('src', '../static/images/room-air-select-0.png');
            $('#room-air-select-dry').attr('src', '../static/images/room-air-select-0.png');
            break;
        case 0x02:
            $('#room-air-select-cool').attr('src', '../static/images/room-air-select-0.png');
            $('#room-air-select-heat').attr('src', '../static/images/room-air-select-1.png');
            $('#room-air-select-dry').attr('src', '../static/images/room-air-select-0.png');
            break;
        case 0x40:
            $('#room-air-select-cool').attr('src', '../static/images/room-air-select-0.png');
            $('#room-air-select-heat').attr('src', '../static/images/room-air-select-0.png');
            $('#room-air-select-dry').attr('src', '../static/images/room-air-select-1.png');
            break;
    }
    $('#set_temp').text(air_conditioner.set_temp.toFixed(0) + '℃');
    setRoomTemperature(air_conditioner.room_temp.toFixed(1) + '℃');
    var lang = "ja"
    switch (air_conditioner.fan_speed) {

        case 0:
            if (lang == 'ja') {
                $('#fan_speed').text('弱');
            } else {
                $('#fan_speed').text('Low');
            }
            break;

        case 1:
            if (lang == 'ja') {
                $('#fan_speed').text('中');
            } else {
                $('#fan_speed').text('Medium');
            }
            break;

        case 2:
            if (lang == 'ja') {
                $('#fan_speed').text('強');
            } else {
                $('#fan_speed').text('High');
            }
            break;
    }
}

function setRoomHumi(humi) {
    $("p#humidity").text(parseFloat(humi).toFixed(1));
}

function setRoomPower(power) {
    $("p#power").text(power + 'kW');
}

function getElevator() {
    $.ajax({
        type: 'GET',
        url: api_filter + '?ucode[]=00001C000000000000020000000634B4',
        dataType: 'json',
        success: function (data) {
            data = data[0][0]["data"][0]["instance"]

            $("p#ele_place").text(data)

            setInterval(function () {
                $("p#ele_place").fadeOut(500, function () {
                    $(this).fadeIn(500)
                });
            }, 1000);

        }
    });

}

function setLight(room, light) {
    console.log("set : " + room + " light  : " + light);
    if (light == "1") {
        $("img#light-" + room).attr("src", "./static/images/map-light-on.png");
    } else {
        $("img#light-" + room).attr("src", "./static/images/map-light-off.png");
    }
}

function setTemp(room, temp) {
    $("tr#" + room + " td").eq(2).text(temp)
    //console.log($("#light" + room).attr()); attr"src", "./static/images/map-light-on.png");
}

function getPower(ucode) {
    power_vals = ["100", "120", "130", "150", "160"]
    power = power_vals[Math.floor(Math.random() * power_vals.length)];
    return power
}

function getLight(room, ucode) {
    $.ajax({
        type: 'GET',
        url: api_filter + '?ucode=' + ucode,
        dataType: 'json',
        success: function (data) {
            data = data[0][0]["data"][0]["instance"]
            setLight(room, data)
            return data;

        }
    });

}

function getTem(room, ucode) {
    var tem = ""
    $.ajax({
        type: 'GET',
        url: api_filter + '?ucode=' + ucode,
        dataType: 'json',
        success: function (data) {

            if (data != null) {
                if (data[0][0]['data'][0] != null) {
                    tem = data[0][0]["data"][0]["instance"]
                    setTemp(room, tem);
                    setRoomTemperature(tem)
                }
            }
        }
    });
    return tem
}

function getHumi(room, ucode) {
    var humi = ""
    $.ajax({
        type: 'GET',
        url: api_filter + '?ucode=' + ucode,
        dataType: 'json',
        success: function (data) {
            if (data != null) {
                if (data[0][0]['data'][0] != null) {
                    data = data[0][0]["data"][0]["instance"]
                    humi = data
                    setHumi(room, data)
                    setRoomHumi(data)
                }
            }
        }
    });
    return humi
}

function setHumi(room, humi) {
    $("tr#" + room + " td").eq(4).text(humi)
}

function getFloorContext(room_paras) {
    for (var r in room_paras) {
        light = getLight(r, room_paras[r].light)

        setLight(r, light)
        var sensor = room_paras[r].sensor
        for (var s in sensor) {
            for (var ct in sensor[s]) {
                switch (ct) {
                    case 'temperature':
                        tem = getTem(r, sensor[s][ct]);
                        break;
                    case 'humidity':
                        humi = getHumi(r, sensor[s][ct])
                        break;
                    case 'human':
                        break;
                }
            }
        }
    }
}

function callElevator(floor, value) {
    value = floor.toUpperCase() + "F" + value //'3Fdown';

    $.ajax({
        type: 'POST',
        url: "/api_control",
        data: JSON.stringify({
            ucode: '00001C000000000000020000000634B4',
            instance: value
        }),
        contentType: 'application/json',
        success: function (response) {
            console.log(response)
        }
    });
}


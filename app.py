from flask import Flask, render_template, jsonify, request
import json
import requests

app = Flask(__name__)

rooms_all = {
    '3': ['a301', 'a302', 'a303', 'a304', 'a305', 'a306'],
    '2': ['a201', 'a202', 'a203', 'a204'],
    '1': ['a101', 'a102', 'a103', 'a104', 'a105'],
    'b1': ['b102', 'b103', 'b104', 'b106'],
    'b2': ['b202', 'b203', 'b204', 'b205']
}

room_map_area_all = {
    '3': ["216,283,263,407", "264,283,366,407", "367,283,415,407", "416,283,517,407", "518,283,620,407",
          "772,255,772,408,838,407,849,418,849,433,1003,433,1003,255"],
    '2': ["216,283,264,407", "265,283,313,407", "315,283,460,407", "462,283,620,407"],
    '1': ["216,284,263,407", "265,283,366,407", "367,283,415,407", "416,283,517,407", "518,283,620,407"],
    'b1': ["292,294,374,425", "375,297,471,425", "472,300,621,425", "772,309,848,426" 'b103', 'b104', 'b106', 'b107'],
    'b2': ["314,296,419,425", "420,299,523,425", "524,302,621,425",
           "772,309,772,426,835,426,835,451,1004,452,1003,286,835,280,835,311"]
}

floors_all = ['3', '2', '1', 'b1', 'b2']


def readJson(fileName):
    with open('./static/json/' + fileName) as json_file:
        data = json.load(json_file)
        return data


def ucode_mapping(room_para_data):
    for k, v in room_para_data.items():
        # print(k)
        # print(v['sensor'])
        v['sensor'] = [sensors[s] for s in v['sensor']]
        # print(v['light'])
        v['light'] = lights[v['light']]


sensors = readJson("sensors.json")
lights = readJson("lights.json")
room_para_data = readJson("rooms-en.json")
ucode_mapping(room_para_data)

air_data = {
    'id': "49",
    'setting_bit': 0xff,
    'on_off': 1,
    'operation_mode': 4,
    'ventilation_mode': 0,
    'ventilation_amount': 0,
    'set_point': 26.0,
    'fan_speed': 0,
    'fan_direction': 7,
    'filter_sign_reset': 0
}


def room_sensors_mapping(rooms):
    room_sensor = {}
    for room in rooms:
        room_sensor[room] = sensors[room]
    return room_sensor


def room_lights_mapping(rooms):
    room_light = {}
    for room in rooms:
        room_light[room] = lights[room]
    return room_light


# def ucode_mapping(room_para_data):
#     for k, v in room_para_data.items():
#         # print(k)
#         # print(v['sensor'])
#         v['sensor'] = [sensors[s] for s in v['sensor']]
#         # print(v['light'])
#         v['light'] = lights[v['light']]


def room_para_mapping(rooms):
    roomPara = {}
    for room in rooms:
        roomPara[room] = room_para_data[room]
    return roomPara


@app.route('/')
def hello_world():
    # initializeData()
    floor = '3'
    rooms = rooms_all[floor]
    roomParas = room_para_mapping(rooms)
    room_area = room_map_area_all[floor]
    return render_template('floor_test.html', floors=floors_all, floor=floor, rooms=rooms, room_area=room_area,
                           room_paras=roomParas)


@app.route('/<floor>')
def floor(floor):
    rooms = rooms_all[floor]
    room_area = room_map_area_all[floor]
    roomParas = room_para_mapping(rooms)
    return render_template("floor_test.html", floor=floor, floors=floors_all, rooms=rooms, room_area=room_area,
                           room_paras=roomParas)


@app.route('/room/<room>')
def room(room):
    single_room_para = room_para_mapping([room])
    return render_template('room.html', room=room, floors=floors_all,
                           para=single_room_para)  # render_template(tem_name, title=floor)


@app.route('/air_get', methods=['POST'])
def air_get():
    air_id = request.json['air_id']
    air_get = "http://172.31.8.129/api/v1/air_conditioners/" + str(air_id) + ".json"
    res = requests.get(air_get)
    data = res.json()
    return jsonify(data)


@app.route('/air_fan_setting', methods=['POST'])
def air_fan_setting():
    air_id = request.json['ucode']
    fan = request.json['fan']
    global air_data
    air_data["id"] = air_id
    air_data["fan_speed"] = air_data["fan_speed"] + fan
    if air_data["fan_speed"] > 2:
        air_data["fan_speed"] = 2
    elif air_data["fan_speed"] < 0:
        air_data["fan_speed"] = 0

    air_api = "http://172.26.16.8/api/ducrbcontrol/airconditioner/"
    headers = {"Content-Type": "application/json"}

    r = requests.put(url=air_api, data=json.dumps(air_data), headers=headers, auth=('koshizukaLab', '8TxgS73KmG'))
    return jsonify(air_data)


@app.route('/air_control_temp', methods=['POST'])
def air_control_temp():
    air_id = request.json['ucode']
    temp = request.json['temp']
    global air_data
    air_data["id"] = air_id
    air_data["set_point"] = air_data["set_point"] + temp

    if air_data["set_point"] > 30:
        air_data["set_point"] = 30
    elif air_data["set_point"] < 20:
        air_data["set_point"] = 20
    air_api = "http://172.26.16.8/api/ducrbcontrol/airconditioner/"
    headers = {"Content-Type": "application/json"}
    r = requests.put(url=air_api, data=json.dumps(air_data), headers=headers, auth=('koshizukaLab', '8TxgS73KmG'))
    # print(r, r.status_code)
    return jsonify(air_data)


@app.route('/air_control', methods=['POST'])
def air_control():
    air_id = request.json['ucode']
    value = request.json['on_off']
    global air_data

    air_data["id"] = air_id
    air_data["on_off"] = value

    air_api = "http://172.26.16.8/api/ducrbcontrol/airconditioner/"
    headers = {"Content-Type": "application/json"}
    r = requests.put(url=air_api, data=json.dumps(air_data), headers=headers, auth=('koshizukaLab', '8TxgS73KmG'))

    return jsonify(air_data)

@app.route('/api_control', methods=['POST'])
def api_control():
    control_api = "http://172.31.8.129/tes/1.0/control.json"
    ucode = request.json['ucode']
    value = request.json['instance']
    data = {'ucode': ucode, 'instance': value}
    r = requests.post(url=control_api, data=json.dumps(data))
    return 'Ok'


@app.template_filter('reverse')
def reverse_filter(s):
    letter = s[0].upper()
    num = s[1:]
    return letter + num


if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0")

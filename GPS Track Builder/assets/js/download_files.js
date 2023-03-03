function download_file() {
    //藉型別陣列建構的 blob 來建立 URL
    let fileName = "path.bin";
    const data = data_package();
    let temp="";
    let blob = new Blob(data, {
        type: "application/octet-stream"
    });
    var href = URL.createObjectURL(blob);
    // 從 Blob 取出資料
    var link = document.createElement("a");
    document.body.appendChild(link);
    link.href = href;
    link.download = fileName;
    link.click();

    add_log("路線資料下載完成","blue");
}

//打包並回傳資料
function data_package(){
    let data_list = new Array();    //打包好的bin檔案
    bubblesort();                   //依EP.lat進行排序
    init_next_point_address();      //設定當前address
    get_next_point_after_sort();    //設定next address 

    let data_info = new Uint8Array(new ArrayBuffer(16));  //檔案資訊
    data_info[0] = new Date().getMonth()+1  //月
    data_info[1] = new Date().getDate();    //日
    data_info[2] = points_on_edges_of_graphics_to_output.length;    //資料長度
    data_list.push(data_info);

    for(var i=0; i<points_on_edges_of_graphics_to_output.length; i++){
        var data_ep = {
            'nsew_area':get_nsew_area(points_on_edges_of_graphics_to_output[i][2].lat, points_on_edges_of_graphics_to_output[i][2].lon),
            'lat':parseInt(points_on_edges_of_graphics_to_output[i][2].lat * 1000000),  //結束點緯度
            'lon':parseInt(points_on_edges_of_graphics_to_output[i][2].lon * 1000000),  //結束點經度
            'cursor':parseInt(get_point_cursor(points_on_edges_of_graphics_to_output[i][1], points_on_edges_of_graphics_to_output[i][2]) / 2),
            'next_address':points_on_edges_of_graphics_to_output[i][4],
            'lat_differ':get_point_differ(parseInt(points_on_edges_of_graphics_to_output[i][1].lat * 1000000), parseInt(points_on_edges_of_graphics_to_output[i][2].lat * 1000000)),
            'lon_differ':get_point_differ(parseInt(points_on_edges_of_graphics_to_output[i][1].lon * 1000000), parseInt(points_on_edges_of_graphics_to_output[i][2].lon * 1000000)),
        };    

        var temp = new Uint8Array(new ArrayBuffer(4));
        temp[0] = parseInt(data_ep.lat_differ / 256);
        temp[1] = parseInt(data_ep.lat_differ % 256);
        temp[2] = parseInt(data_ep.lon_differ / 256);
        temp[3] = parseInt(data_ep.lon_differ % 256);

        let arr = new Uint8Array(new ArrayBuffer(16));
        arr[0] = data_ep.nsew_area;
        arr[1] = (data_ep.lat / (256*256*256));
        arr[2] = ((data_ep.lat % (256*256*256)) / (256*256));
        arr[3] = (((data_ep.lat % (256*256*256)) % (256*256)) / 256);
        arr[4] = (((data_ep.lat % (256*256*256)) % (256*256)) % 256);
        arr[5] = (data_ep.lon / (256*256*256));
        arr[6] = ((data_ep.lon % (256*256*256)) / (256*256));
        arr[7] = (((data_ep.lon % (256*256*256)) % (256*256)) / 256);
        arr[8] = (((data_ep.lon % (256*256*256)) % (256*256)) % 256);
        arr[9] = parseInt(data_ep.next_address / 256);
        arr[10] = parseInt(data_ep.next_address % 256);
        arr[11] = parseInt(data_ep.cursor / 2);
        arr[12] = parseInt(data_ep.lat_differ / 256);
        arr[13] = parseInt(data_ep.lat_differ % 256);
        arr[14] = parseInt(data_ep.lon_differ / 256);
        arr[15] = parseInt(data_ep.lon_differ % 256);
        
        data_list.push(arr);

        console.log(points_on_edges_of_graphics_to_output[i]);
    }
    return data_list;
}

//依照結束點緯度sort
var time = 0;

// 比較函數
function compare(a, b) {
    if (a < b) {
        return 1;
    } else return 0;
    // 不符合排序就return0
}

// 交換函數
function swap(list, a, b) {
    var ele = list[a];
    list[a] = list[b];
    list[b] = ele;

}

// 每一回合執行該函數
function bubbleoneround() {
    var sortornot = 1;
    for (var i = 0; i < points_on_edges_of_graphics_to_output.length - 1; i++) {
        if (compare(points_on_edges_of_graphics_to_output[i][2].lat, points_on_edges_of_graphics_to_output[i + 1][2].lat) == 0) { //ep.lat
            swap(points_on_edges_of_graphics_to_output, i, i + 1)
            sortornot = 0;
            time++
        }
        // 最後一趟會完全是1
    }
    return sortornot;
}

// bubble函數
function bubblesort() {
    for (var i = 0; i < points_on_edges_of_graphics_to_output.length - 1; i++) {
        var sortornot = bubbleoneround(points_on_edges_of_graphics_to_output)
        if (sortornot == 1) {
            console.log(time)
            break;
        }

    }
}

function init_next_point_address(){
    for(var i=0; i<points_on_edges_of_graphics_to_output.length; i++){
        points_on_edges_of_graphics_to_output[i][3] = i+1;  //資料從address:00000010(第二筆)開始
    }
}

function get_nsew_area(lat, lon){	//判讀東西經及南北緯
    var area = -1;
    if(lat > 0 && lon > 0){
        area = 17;	//17(dec) = 11(hex)
    }else if(lat > 0 && lon < 0){
        area = 16;	//16(dec) = 10(hex)
    }else if(lat < 0 && lon > 0){
        area = 1;	//1(dec) = 01(hex)
    }else if(lat < 0 && lon < 0){
        area = 0;	//0(dec) = 00(hex)
    }
    return area;
}

function get_next_point_after_sort(){
    for(var i=0; i<points_on_edges_of_graphics_to_output.length; i++){
        var index = points_on_edges_of_graphics_to_output[i][0];    //index
        var target = index + 1; //目標
        for(var j=0; j <points_on_edges_of_graphics_to_output.length; j++){
            var temp_point = points_on_edges_of_graphics_to_output[j];
            if(target == temp_point[0]) points_on_edges_of_graphics_to_output[i][4] = points_on_edges_of_graphics_to_output[j][3]
        }
    }
}

function get_point_cursor(x, y){
    var radian = Math.atan2(x.lon - y.lon, x.lat - y.lat); // 返回來的是弧度
    var angle = 180 / Math.PI * radian; // 根據弧度計算角度
    return angle;
}

function get_point_differ(value1, value2){
    return value1 - value2;
}
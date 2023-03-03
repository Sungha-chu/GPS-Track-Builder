/*
各項參數
*/
let user_location = null;   //使用者的座標
let map;    //地圖物件
let user_location_icon = new L.Icon({   //使用者座標icon
    iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25 , 41],
    iconAnchor: [12 , 41],
    popupAnchor: [1 , 34],
    shadowSize: [41 , 41],
    opacity: 1.0
});
let drawItem;   //圖層
let points_marker_by_user = new Array(); //圖形標註座標
let points_on_edges_of_graphics_to_output = new Array(); //框選圖形邊上座標清單(垂直掃描結果)
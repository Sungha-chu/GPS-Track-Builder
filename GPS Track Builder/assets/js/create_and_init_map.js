function create_map(){
  // *** 放置地圖
  let zoom = 15; // 0 - 18
  let center = [25.0854061,121.5615012]; // 中心點座標

  map = L.map(document.getElementById('map'),{  //map基礎設定
    center: [23.5, 121],  // 中心點
    zoom: 18,  // 縮放層級
    crs: L.CRS.EPSG3857,  // 座標系統
  }).setView(center, zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', // 商用時必須要有版權出處
    zoomControl: true , //Show - + button
    maxZoom: 18,  
  }).addTo(map);  //新增底圖

  drawItem = new L.FeatureGroup();  //初始化圖層
  map.addLayer(drawItem);

  map.on('draw:created', draw_created); //監聽繪圖事件
  
  create_draw_func_bar(); //建立繪圖工具(位於左上方)
  create_layer_of_map();  //建立不同種類的地圖
  get_user_location();    //取得使用者位置    【公司座標點: 23.4647148,120.4314508】
  find_user_locate(); //定位使用者位置
}

//建立繪圖工具
function create_draw_func_bar(){
  let drawControl = new L.Control.Draw({
    draw:{
      polyline: true,  //直線:停用
      polygon: true,  //多邊形:啟用
      rectangle: false,  //四邊形:停用
      circle: false,  //圓形:停用
      marker: false,  //標註點:停用
    },
    edit:{
      featureGroup: drawItem,
      edit:false,
      remove:true,
    },
  });
  map.addControl(drawControl);
  
}


//監聽繪圖事件與建立圖形座標list
function draw_created(e){
  let layer = e.layer;
  points_marker_by_user = layer._latlngs[0];  //讀取第一筆資料
  console.log(points_marker_by_user); //輸出測試points_marker_by_user被寫入成功
  drawItem.addLayer(layer);  
}

//建立不同種類地圖
function create_layer_of_map(){
    var baselayers = {
        'OpenStreetMap.Mapnik': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
        'OpenStreetMap.DE': L.tileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png'),
        'OpenStreetMap.CH': L.tileLayer('https://tile.osm.ch/switzerland/{z}/{x}/{y}.png'),
        'OpenStreetMap.France':  L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
        'OpenStreetMap.HOT': L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'),
        'OpenStreetMap.BZH': L.tileLayer('https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png'),
        'OpenTopoMap': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png')
    };
    var overlays = {};
    L.control.layers(baselayers, overlays).addTo(map);
    //baselayers['OpenStreetMap.Mapnik'].addTo(map);
}

//取得使用者座標
function get_user_location(){
    map.locate({
        setView: true, // 是否讓地圖跟著移動中心點
        watch: false, // 是否要一直監測使用者位置
        maxZoom: 0, // 最大的縮放值
        enableHighAccuracy: true, // 是否要高精準度的抓位置
        timeout: 10000 // 觸發locationerror事件之前等待的毫秒數
    });

    map.on('locationfound', onLocationFound);   // 成功監聽到使用者的位置時觸發(取得座標、標註座標)
    map.on('locationerror', onLocationError);   // 失敗時觸發
    
}

//成功取得使用者座標時觸發
function onLocationFound(e) {
    user_location = e.latlng;    //設定使用者座標
    if(user_location != null) L.marker(user_location,{icon:user_location_icon}).addTo(map); //標註使用者座標
    add_log("定位使用者座標完成");
}

//無法取得使用者座標時觸發
function onLocationError(e) {
    alert("無法取得使用者座標");
    add_log("無法取得使用者座標" , "red");
}

//定位使用者位置
function find_user_locate(){
  L.control.locate({
    position: 'topleft',
    locateOptions: {
      enableHighAccuracy: true
    },
    strings: {
      title: '定位我的位置',
      metersUnit: '公尺',
      feetUnit: '英尺',
      popup: '距離誤差：{distance}{unit}以內'
    },
    clickBehavior: {
      inView: 'stop',
      outOfView: 'setView',
      inViewNotFollowing: 'inView',
    }
  }).addTo(map);
}

function marker_point(point){
  L.marker(point).addTo(map);
}
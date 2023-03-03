function create_new_list_by_distance(){
    let distance = document.querySelector('#interval_of_distance_set_by_user').value;   //使用者輸入的間隔距離
    let dir = document.querySelector('#direction').value;  //取得路經規劃方向
    if(distance != ""){ //檢查使用者是否有輸入間隔距離
        switch(document.querySelector('#unit_of_distance').value){  //select選單選擇的單位
            case 'm':   //公尺
                break;
            case 'km':  //公里
                distance = distance * 1000; //公尺轉公里
                break;
        }

        if(IsPtInPoly()) add_log("使用者座標在框選範圍內" , "#b1c9e2");   //判斷使用者是否被框選
        else add_log("使用者座標不在框選範圍內" , "#b1c9e2");

        add_log("間隔距離設定為" + distance);
        add_log("路徑規劃方向: " + dir);

        let scan_dir = getScanDirection(dir);   //取得掃描線方向(垂直或水平)
        let scan_list = new Array();
        let scan_result = new Array();
        if(scan_dir == "vertical"){
            scan_list = get_vertical_scanner_line(distance);   //取得垂直掃描線清單
            scan_result = vertical_scan(scan_list);    //垂直掃描結果
        }else if(scan_dir == "horizontal"){
            scan_list = get_horizontal_scanner_line(distance);   //取得水平掃描線清單
            scan_result = horizontal_scan(scan_list);  //水平掃描結果
        }
        sort_list(scan_result, dir);
        add_log("掃描線建立成功");
        add_log("掃描結果:建立" + scan_result.length + "個座標點","#b1c9e2");
        
        var data_to_mcu = new Array();
        var count = 1;
        for(var i=0; i<scan_result.length; i++){
            var tmp = scan_result[i];
            L.marker(tmp , {
                title: "("+tmp.lat+","+tmp.lng+")",
            }).addTo(map);
            if(i % 2 == 0){
                var tmp = new Array();      //tmp: [id, sp, ep, address]
                let sp ={
                    'lat': scan_result[i].lat,
                    'lon': scan_result[i].lng
                };
                let ep ={
                    'lat': scan_result[i+1].lat,
                    'lon': scan_result[i+1].lng
                };

                var draw_tmp = new Array(); //去程
                draw_tmp.push(sp);
                draw_tmp.push(ep);
                draw_path(draw_tmp);

                tmp.push(count++);      //id
                tmp.push(sp);           //sp
                tmp.push(ep);           //ep   
                tmp.push(-1);           //address
                tmp.push(-1);           //next address 
                data_to_mcu.push(tmp);

                tmp = new Array();          //回程
                var temp_point = sp;
                sp = ep;
                ep = temp_point;

                tmp.push(count++);      //id
                tmp.push(sp);           //sp
                tmp.push(ep);           //ep   
                tmp.push(-1);           //address  
                tmp.push(-1);           //next address
                data_to_mcu.push(tmp);

                if(i+2<scan_result.length){ //上下左右移
                    tmp = new Array();
                    sp = ep;
                    ep ={
                        'lat': scan_result[i+2].lat,
                        'lon': scan_result[i+2].lng
                    };
    
                    tmp.push(count++);      //id
                    tmp.push(sp);           //sp
                    tmp.push(ep);           //ep   
                    tmp.push(-1);           //address 
                    tmp.push(-1);           //next address 
                    data_to_mcu.push(tmp);

                    draw_tmp = new Array();
                    draw_tmp.push(sp);
                    draw_tmp.push(ep);
                    draw_path(draw_tmp);
                }
                
            }
        }

        points_on_edges_of_graphics_to_output = data_to_mcu;
        add_log("路徑規劃完成","#b1c9e2");
    }
    else alert("未輸入間隔距離");
}

//計算座標是否坐落於框選範圍
function IsPtInPoly() {
	var iSum = 0,
		iCount;
	var dLon1, dLon2, dLat1, dLat2, dLon;
	if (points_marker_by_user.length < 3) return false;
	iCount = points_marker_by_user.length;
	for (var i = 0; i < iCount; i++) {
		if (i == iCount - 1) {
			dLon1 = points_marker_by_user[i].lng;
			dLat1 = points_marker_by_user[i].lat;
			dLon2 = points_marker_by_user[0].lng;
			dLat2 = points_marker_by_user[0].lat;
		} else {
			dLon1 = points_marker_by_user[i].lng;
			dLat1 = points_marker_by_user[i].lat;
			dLon2 = points_marker_by_user[i + 1].lng;
			dLat2 = points_marker_by_user[i + 1].lat;
		}
		//以下語句判斷A點是否在邊的兩端點的水平平行線之間，在則可能有交點，開始判斷交點是否在左射線上
		if (((user_location.lat >= dLat1) && (user_location.lat < dLat2)) || ((user_location.lat >= dLat2) && (user_location.lat < dLat1))) {
			if (Math.abs(dLat1 - dLat2) > 0) {
				//得到 A點向左射線與邊的交點的x座標：
				dLon = dLon1 - ((dLon1 - dLon2) * (dLat1 - user_location.lat)) / (dLat1 - dLat2);
				if (dLon < user_location.lng) iSum++;
			}
		}
	}
	if (iSum % 2 != 0){      
        return true;
    }
	return false;
}

//依照期望路徑方向取得掃描線方向
function getScanDirection(dir){
    let result;
    switch(dir){
        case 'NSEW':
        case 'NSWE':
        case 'SNEW':
        case 'SNWE':
            result = "vertical";    //垂直方向
            break;
        case 'EWNS':
        case 'EWSN':
        case 'WENS':
        case 'WESN':
            result = "horizontal";  //水平方向
            break;
    }
    return result;
}

//取得垂直掃描線清單
function get_vertical_scanner_line(distance){
    let scanner_list = new Array(); //掃描線清單

    var min_lng = points_marker_by_user[0].lng; //假設最小經度為points_marker_by_user[0]的經度
    var max_lng = points_marker_by_user[0].lng; //假設最大經度為points_marker_by_user[0]的經度
    var min_lat = points_marker_by_user[0].lat; //假設最小緯度為points_marker_by_user[0]的緯度
    var max_lat = points_marker_by_user[0].lat; //假設最大緯度為points_marker_by_user[0]的緯度

    for(var i=0; i<points_marker_by_user.length;i++){   //走訪座標清單
        if(min_lng > points_marker_by_user[i].lng) min_lng = points_marker_by_user[i].lng;  //找最小經度
        if(max_lng < points_marker_by_user[i].lng) max_lng = points_marker_by_user[i].lng;  //找最大經度
        if(min_lat > points_marker_by_user[i].lat) min_lat = points_marker_by_user[i].lat;  //找最小緯度
        if(max_lat < points_marker_by_user[i].lat) max_lat = points_marker_by_user[i].lat;  //找最大緯度
    }

    let dist = distance * 0.00000900900901; //公尺轉經緯度: 1公尺約0.00000900900901度
    let index = 0;
    while(min_lng + index * dist <= max_lng){   //建置垂直掃描線(經線)
        let sp1 = {
            'lat': min_lat,
            'lng': min_lng + index * dist
        };
        let sp2 = {
            'lat': max_lat,
            'lng': min_lng + index * dist
        };
        scanner_list.push([sp1, sp2]);
        index = index + 1;
    }
    index = 0;
    return scanner_list;
}

//取得水平掃描線清單
function get_horizontal_scanner_line(distance){
    let scanner_list = new Array(); //掃描線清單

    var min_lng = points_marker_by_user[0].lng; //假設最小經度為points_marker_by_user[0]的經度
    var max_lng = points_marker_by_user[0].lng; //假設最大經度為points_marker_by_user[0]的經度
    var min_lat = points_marker_by_user[0].lat; //假設最小緯度為points_marker_by_user[0]的緯度
    var max_lat = points_marker_by_user[0].lat; //假設最大緯度為points_marker_by_user[0]的緯度

    for(var i=0; i<points_marker_by_user.length;i++){   //走訪座標清單
        if(min_lng > points_marker_by_user[i].lng) min_lng = points_marker_by_user[i].lng;  //找最小經度
        if(max_lng < points_marker_by_user[i].lng) max_lng = points_marker_by_user[i].lng;  //找最大經度
        if(min_lat > points_marker_by_user[i].lat) min_lat = points_marker_by_user[i].lat;  //找最小緯度
        if(max_lat < points_marker_by_user[i].lat) max_lat = points_marker_by_user[i].lat;  //找最大緯度
    }

    let dist = distance * 0.00000900900901; //公尺轉經緯度: 1公尺約0.00000900900901度
    let index = 0;
    while(min_lat + index * dist <= max_lat){   //建置水平掃描線(緯線)
        let sp1 = {
            'lat': min_lat + index * dist,
            'lng': min_lng
        };
        let sp2 = {
            'lat': min_lat + index * dist,
            'lng': max_lng
        };
        scanner_list.push([sp1, sp2]);
        index = index + 1;
    }
    index = 0;

    return scanner_list;
}

//透過垂直掃描線掃描圖形
function vertical_scan(scanner_list){
    let points_on_edges_of_graphics = new Array();

    for(var index=0; index<points_marker_by_user.length; index++){
        if(index < points_marker_by_user.length-1){
            //L.polyline([points_marker_by_user[index], points_marker_by_user[index + 1]], { color: ' red ' }).addTo(map);  //繪製被掃描線
            for(var i=0; i<scanner_list.length; i++){
                //L.polyline(scanner_list[i], { color: ' blue ' }).addTo(map);  //繪製掃描線
                let result = segmentsIntr(scanner_list[i][0], scanner_list[i][1], points_marker_by_user[index], points_marker_by_user[index + 1]);
                if(result != false){
                    points_on_edges_of_graphics.push(result);
                }
            }
        }else{
            //L.polyline([points_marker_by_user[index], points_marker_by_user[0]], { color: ' red ' }).addTo(map);  //繪製被掃描線
            for(var i=0; i<scanner_list.length; i++){
                //L.polyline(scanner_list[i], { color: ' blue ' }).addTo(map);  //繪製掃描線
                let result = segmentsIntr(scanner_list[i][0], scanner_list[i][1], points_marker_by_user[index], points_marker_by_user[0]);  //頭尾相接
                if(result != false){
                    points_on_edges_of_graphics.push(result);
                }
            }
        }
    }

    return points_on_edges_of_graphics;
}

//透過水平掃描線掃描圖形
function horizontal_scan(scanner_list){
    let points_on_edges_of_graphics = new Array();

    for(var index=0; index<points_marker_by_user.length; index++){
        if(index < points_marker_by_user.length-1){
            //L.polyline([points_marker_by_user[index], points_marker_by_user[index + 1]], { color: ' red ' }).addTo(map);  //繪製被掃描線
            for(var i=0; i<scanner_list.length; i++){
                //L.polyline(scanner_list[i], { color: ' blue ' }).addTo(map);  //繪製掃描線
                let result = segmentsIntr(scanner_list[i][0], scanner_list[i][1], points_marker_by_user[index], points_marker_by_user[index + 1]);
                if(result != false){
                    points_on_edges_of_graphics.push(result);
                }
            }
        }else{
            //L.polyline([points_marker_by_user[index], points_marker_by_user[0]], { color: ' red ' }).addTo(map);  //繪製被掃描線
            for(var i=0; i<scanner_list.length; i++){
                //L.polyline(scanner_list[i], { color: ' blue ' }).addTo(map);  //繪製掃描線
                let result = segmentsIntr(scanner_list[i][0], scanner_list[i][1], points_marker_by_user[index], points_marker_by_user[0]);  //頭尾相接
                if(result != false){
                    points_on_edges_of_graphics.push(result);
                }
            }
        }
    }
    
    return points_on_edges_of_graphics;
}

//求交點座標
function segmentsIntr(sp1, sp2, up1, up2){  
    let a = {
        x: sp1.lng,
        y: sp1.lat
    };
    let b = {
        x: sp2.lng,
        y: sp2.lat
    };
    let c = {
        x: up1.lng,
        y: up1.lat
    };
    let d = {
        x: up2.lng,
        y: up2.lat
    };

    var nx=b.y - a.y,   
    ny=a.x - b.x;  
    var normalLine = {  x: nx, y: ny }; 
    var dist= normalLine.x*c.x + normalLine.y*c.y;  

    var nx1 = (b.y - a.y), ny1 = (a.x - b.x);  //線段ab的法線N1 
    var nx2 = (d.y - c.y), ny2 = (c.x - d.x);  //線段cd的法線N2 

    
    var denominator = nx1*ny2 - ny1*nx2;  //兩條法線做交叉相乘  
    if (denominator==0) return false;   //如果結果為0, 說明線段ab和線段cd平行或共線,不相交

    //在法線N2上的投影  
    var distC_N2=nx2 * c.x + ny2 * c.y;  
    var distA_N2=nx2 * a.x + ny2 * a.y-distC_N2;  
    var distB_N2=nx2 * b.x + ny2 * b.y-distC_N2;  

    
    if ( distA_N2*distB_N2>=0  ) return false;// 點a投影和點b投影在點c投影同側 (對點在線段上的情況當作不相交處理);

    //在法線N1上的投影  
    var distA_N1=nx1 * a.x + ny1 * a.y;  
    var distC_N1=nx1 * c.x + ny1 * c.y-distA_N1;  
    var distD_N1=nx1 * d.x + ny1 * d.y-distA_N1;  
    if ( distC_N1*distD_N1>=0  ) {  
        return false;  
    }  

    //計算交點坐標  
    var fraction= distA_N2 / denominator;  
    var dx= fraction * ny1, dy= -fraction * nx1;

    let result = {
        'lat': a.y + dy,
        'lng': a.x + dx
    }

    return result;
}

//進行排序
function sort_list(list, dir){
    switch(dir){
        case 'NSEW':
            sort_lat(list); //NS
            sort_lng(list); //EW
            break;
        case 'NSWE':
            sort_lat(list); //NS
            sort_lng2(list);//WE
            break;
        case 'SNEW':
            sort_lat2(list);//SN
            sort_lng(list); //EW
            break;
        case 'SNWE':
            sort_lng2(list);//SN
            sort_lat2(list);//WE
            break;
        case 'EWNS':
            sort_lng(list); //EW
            sort_lat(list); //NS
            break;
        case 'EWSN':
            sort_lng(list); //EW
            sort_lat2(list);//SN
            break;
        case 'WENS':
            sort_lng2(list);//WE
            sort_lat(list); //NS
            break;
        case 'WESN':
            sort_lng2(list);//WE
            sort_lng2(list);//SN
            break;
    }
}

function sort_lat(list){
    list.sort(function(p1, p2){    //以lat為基準進行排序(N->S)
       return p2.lat - p1.lat;
    });
 }

 function sort_lat2(list){
    list.sort(function(p1, p2){    //以lat為基準進行排序(S->N)
       return p1.lat - p2.lat;
    });
 }
 
function sort_lng(list){
    list.sort(function(p1, p2){    //以lng為基準進行排序(E->W)
       return p2.lng - p1.lng;
    });
 }

 function sort_lng2(list){
    list.sort(function(p1, p2){    //以lng為基準進行排序(W->E)
       return p1.lng - p2.lng;
    });
 }


//繪製路線
function draw_path(list){
    L.polyline(list,{color: 'blue'}).addTo(map);
}
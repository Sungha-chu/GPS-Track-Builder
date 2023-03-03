function init(){
   create_map();  //Initial map and mark own location
   add_log("地圖建置完成");
}

//將訊息記錄在log視窗
function add_log(msg , font_color){
   var ul = document.querySelector('#log_msg');
   var li = document.createElement('li');
   if(font_color != "") li.style.color = font_color;  //設定文字顏色
   li.innerHTML = msg;
   ul.appendChild(li);
}
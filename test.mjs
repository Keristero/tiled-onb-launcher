function get_request(url){
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.send();
    xhr.onload = () => {
    if (xhr.readyState == 4 && xhr.status == 200) {
        tiled.log(`Status:${xhr.status}`);
    } else {
        tiled.log(`Error: ${xhr.status}`);
    }
    };
}

let settings = {
    server_address:`127.0.0.1`,
    server_port:`8765`
}

var onb_launch_action = tiled.registerAction("ONB: Launch", function(action) {
    tiled.log(`Launching ONB`);
    load_properties()
    let data = ``

    if(tiled.activeAsset && tiled.activeAsset.isTileMap) {
        let map = tiled.activeAsset;
        //add the map to data string
        let regex = /\/([^\/]+)\.[^\/.]+$/;
        let map_name = map.fileName.match(regex)[1];
        data += `area_id=${map_name}`
        //logging property keys for development
        if(map.selectedObjects.length > 0){
            for(let selected_object of map.selectedObjects){
                for(let key in selected_object){
                    //tiled.log(`${key}:${selected_object[key]}`)
                }
                data += `&objectid=${selected_object.id}`
            }
        }
    }
    
    let launch_string = `onb://jackin?address=${settings.server_address}&port=${settings.server_port}&data=${data}`
    tiled.log(`launch string=${launch_string}`);

    get_request(launch_string)
})

function load_properties(){
    if(tiled.project){
        let server_address = tiled.project.property('server_address')
        let server_port = tiled.project.property('server_port')
        tiled.log(`loaded ${server_address}, ${server_port}`)
        if(server_address){
            settings.server_address = server_address
        }
        if(server_port){
            settings.server_port = Number(server_port)
        }
    }
}

function save_properties(server_address,server_port){
    settings.server_address = server_address
    settings.server_port = server_port
    if(tiled.project){
        tiled.project.setProperty('server_address',server_address)
        tiled.project.setProperty('server_port',server_port)
    }
}

var onb_configure_action = tiled.registerAction("ONB: Configure Launcher", function(action) {
    tiled.log(`Configure ONB`);
    load_properties()
    let server_address = tiled.prompt("Enter your server address (no port)",settings.server_address,"Configure ONB")
    let server_port = tiled.prompt("Enter your server port",settings.server_port, "Configure ONB")
    if(!tiled.project){
        tiled.alert("Because you are not using a project you will need to configure again next time you open tiled", "Configure ONB")
    }else{
        save_properties(server_address,server_port)
    }
    tiled.alert("Save the following script to your server/scripts folder", "Configure ONB")

    let lua_code = `
function urldecode(s)
    return s:gsub('+', ' '):gsub('%%(%x%x)', function(h) return string.char(tonumber(h, 16)) end)
end

function parseurl(s)
    s = s:match('%s+(.+)')
    local ans = {}
    for key, value in s:gmatch('([^&=?]-)=([^&=?]+)') do
        ans[key] = urldecode(value)
    end
    return ans
end

Net.on("player_request",function(event)
    print('player_request',event)
    local request_args = parseurl(event.data)
    print(request_args)
    local object = Net.get_object_by_id(request_args.area_id,request_args.id)
    if object then
        Net.transfer_player(event.player_id,request_args.area_id,false,object.x,object.y,object.z)
    else
        Net.transfer_player(event.player_id,request_args.area_id)
    end
end)
`
    let path = tiled.promptSaveFile(`./scripts`, `Text files (*.lua)`,`tiled_onb_extension_support`)
    tiled.log(`saving script to ${path}`);
    /*
    for(let key in tiled){
        tiled.log(`${key}:${tiled[key]}`)
    }
    */
    let lua_file = new TextFile(path,TextFile.WriteOnly)
    lua_file.write(lua_code)
    lua_file.commit()

})

tiled.extendMenu("Command", [
    { action: "ONB: Launch" },
    { separator: true }
]);
onb_launch_action.text = "ONB: Launch"
onb_launch_action.shortcut = "F5"

tiled.extendMenu("Command", [
    { action: "ONB: Configure Launcher" },
    { separator: true }
]);
onb_configure_action.text = "ONB: Configure Launcher"
onb_configure_action.checkable = false
onb_configure_action.shortcut = "Ctrl+F5"

tiled.log(`loaded ONB extension, configure with ${onb_configure_action.shortcut} launch with ${onb_launch_action.shortcut}`)
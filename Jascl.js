
// Jascl Object
function Jascl (config) {
    
    // config
    var chart_title = (config.chart_title === undefined) ? 'Unkown Title' : config.chart_title;
    var chart_style = config.chart_style;  
    var chart_width = (config.chart_size === undefined) ? 640 : parseInt(config.chart_size.split('x')[0]);
    var chart_height = (config.chart_size === undefined) ? 480 : parseInt(config.chart_size.split('x')[1]);       
    var table = (config.data_table === undefined) ? false : config.data_table;
    var series_rotation = (config.series_rotation  === undefined) ? 0 : config.series_rotation ;
    var offsetX = ((chart_width*10)/100);
    var offsetY = offsetX/2;
    if (chart_style == 'pie') {  offsetY = 0 };
    var offsetTitle = 30;
    chart_width+=offsetX;
    chart_height+=offsetY;
    
    var y_axis_ticks = (config.y_axis_ticks === undefined) ?  15 : config.y_axis_ticks;
    var y_axis_text = (config.y_axis_text === undefined) ?  'y axis' : config.y_axis_text;
    var font_size = (config.font_size === undefined) ?  12 : config.font_size ;
    var container_name = config.container;
    var data =  config.data;
    
    var series = (config.series === undefined) ?  [] : config.series
    if (config.series == undefined) { series = [] } else { series = config.series }
    if (series.length == 0) {
        for (s = 0; s < data.length;++s) {series.push(s);}
    }

    if(chart_style == 'single_bar') {
        var keys = Object.keys(data[0]);
        series=[];
        for (n=0;n<keys.length-1;++n) {data.push([]);}
        for (n=0;n<keys.length;++n) {series.push(keys[n])}
    }
    
    var min_value = get_max_or_min(data,'min');
    var max_value = get_max_or_min(data,'max');
    
    // define higher/lower max and min values for an offset
    if (min_value < 0) {min_value = min_value - (max_value * 0.10);}   
    max_value = max_value + (max_value * 0.10);
    
    var range_value = max_value + -min_value;
    var tick_freq = (range_value / y_axis_ticks);
    
    var basic_colors = ['red','green','blue','yellow','coral','BlueViolet','DarkGreen','GoldenRod','brown','LightSlateGrey','RoyalBlue','Magenta','DarkOliveGreen','#555','DodgerBlue'];
    var colors = (config.colors === undefined) ?  basic_colors : config.colors;
    
    var legend = (config.legend === undefined) ? false : config.legend;
   
    // calc cell size
    var cell_width = (chart_width-offsetX) / (data.length) ;
    var cell_heigth = (chart_height-offsetY) / y_axis_ticks; 
    
    // define container size and trigger svg-rendering
    if (series_rotation > 0) {
        padding_bottom=30;
    } else {
        padding_bottom=0;
    }
    $('#' + container_name).css({'height':chart_height+offsetTitle,'width':chart_width,'background':'linear-gradient(to bottom,#bbb,#eee)','padding-bottom':padding_bottom, 'padding-right':offsetY+100,'padding-top':0,'border-radius':10});
    $('#' + container_name).svg({onLoad:render_chart});
    
    
    // render the svg (line_chart)
    function render_chart(svg) {
       
        // chart title
        var text_style_title = svg.group({fill:'black','font-family':'Arial','font-size':(font_size+5),data_id:'title','text-decoration':'underline','text-anchor':'middle'});
        var text_style = svg.group({fill:'black','font-family':'Arial','font-size':font_size,data_id:'text_style'});  
        svg.text(text_style_title,(chart_width/2)+offsetY,font_size+5,chart_title);
 
        if (chart_style != 'pie') {
            // y axis title
            svg.text(text_style,0,100,y_axis_text,{'transform':'rotate(-90,45,90)'});
       
            // grid lines
            var inner_lines = svg.group({stroke:'black',strokeWidth:0.25,data_id:'out_lines'});                  
            
            // horizontal lines
            for (y = 1; y<= y_axis_ticks;++y) {
                svg.line(inner_lines,0,(y * cell_heigth)+offsetTitle,chart_width,(y * cell_heigth)+offsetTitle);
                tick_string = Math.floor(max_value - (tick_freq * (y-1)));
                svg.text(text_style,5,((y-1) * (cell_heigth)+font_size+offsetTitle),String(tick_string));
            }
            
            // vertical lines
            for (x = 1; x <= data.length; ++x) {
                svg.line(inner_lines,(x*cell_width)+offsetX,0+offsetTitle,(x*cell_width)+offsetX,chart_height-offsetY+font_size+offsetTitle);
                if (series[x-1] != undefined) {
                    svg.text(text_style,(((x-1)* cell_width) + offsetX),(chart_height-offsetY+font_size+offsetTitle),String(series[x-1]),{'transform':'rotate('+series_rotation+',' + (((x-1)* cell_width) + offsetX) + ',' + ((((((x-1)* cell_width) + offsetX),chart_height-offsetY+font_size+offsetTitle))) + ')' });
                }
            }
        }
        
        data_keys = Object.keys(data[0]);
        
        // line Chart
        if (chart_style == 'line') {
            $.each(data_keys,function(key_index,key_value) { // each line
                points = [];
                min_value_px=0;
                path = svg.createPath();
                lineG = svg.group({stroke:colors[key_index],strokeWidth:3,data_id:'line_'+key_value,fill:'none'});
                
                $.each(data,function(data_index,data_value) {  // each point
                    y_pos = (((chart_height-offsetY) / (max_value)) * data_value[key_value]) - offsetTitle;
                    if (min_value < 0) { // if min_value is negative
                        y_pos = (((chart_height-offsetY) / (Math.abs(min_value) + (max_value))) * data_value[key_value]);
                        min_value_px = ((chart_height-offsetY) / (Math.abs(min_value) + max_value)) * min_value;
                        y_pos -= min_value_px + offsetTitle;
                    }
                    y_pos = (chart_height-offsetY) - y_pos;
                    x_pos = (data_index * cell_width)+offsetX;
                    points.push([x_pos,y_pos]);
                })    
                svg.path(lineG,path.move([points[0]]).line(points));
            });
            
        // grouped bar Chart
        } else if (chart_style == 'grouped_bar') {
            bar_x_offset=0;
            min_value_px=0;
            bar_width = (Math.floor(cell_width/data_keys.length)) * 0.85;
            $.each(data_keys,function(key_index,key_value) { // each bar
                points = [];
                $.each(data,function(data_index,data_value) {  // each point
                    x_pos = (data_index * cell_width)+offsetX;
                    y_pos = (((chart_height-offsetY) / (max_value)) * data_value[key_value]) - offsetTitle;
                    if (min_value < 0) { // if min_value is negative
                        y_pos = (((chart_height-offsetY) / (Math.abs(min_value) + (max_value))) * data_value[key_value]);
                        min_value_px = ((chart_height-offsetY) / (Math.abs(min_value) + max_value)) * min_value;
                        y_pos -= min_value_px + offsetTitle;
                    }
                    y_pos = (chart_height-offsetY) - y_pos;
                    if (data_value[key_value] >0) {
                        bar_heigth=(chart_height+min_value_px-offsetY+offsetTitle)-y_pos;
                        svg.rect(x_pos+bar_x_offset,y_pos,bar_width,bar_heigth,{fill: colors[key_index]});
                    } else {
                        neg_bar_height = y_pos - (chart_height+min_value_px-offsetY+offsetTitle);
                        svg.rect(x_pos+bar_x_offset,chart_height+min_value_px-offsetY+offsetTitle,bar_width,neg_bar_height,{fill: colors[key_index]});
                    }
                })
                bar_x_offset+=bar_width;
            })
                        
        // single bar Chart
        } else if (chart_style == 'single_bar') {
            c=0;
            bar_x_offset=0;
            min_value_px=0;
            bar_width = (Math.floor(cell_width/data_keys.length)) * 2;
            $.each(data[0],function(key_index,key_value) { // each bar
                x_pos = (c * cell_width)+offsetX;
                y_pos = (((chart_height-offsetY) / (max_value)) * key_value) - offsetTitle;
                if (min_value < 0) { // if min_value is negative
                     y_pos = (((chart_height-offsetY) / (Math.abs(min_value) + (max_value))) * key_value);
                     min_value_px = ((chart_height-offsetY) / (Math.abs(min_value) + max_value)) * min_value;
                     y_pos -= min_value_px + offsetTitle;
                }
                y_pos = (chart_height-offsetY) - y_pos;
                
                if (key_value >0) {
                    bar_heigth=(chart_height+min_value_px-offsetY+offsetTitle)-y_pos;
                    svg.rect((x_pos+bar_x_offset)+(cell_width/2)-(bar_width/2),y_pos,bar_width,bar_heigth,{fill: colors[c],stroke:'black',strokeWidth:2});
                } else {
                    neg_bar_height = y_pos - (chart_height+min_value_px-offsetY+offsetTitle);
                    svg.rect((x_pos+bar_x_offset)+(cell_width/2)-(bar_width/2),chart_height+min_value_px-offsetY+offsetTitle,bar_width,neg_bar_height,{fill: colors[c],stroke:'black',strokeWidth:2});
                }
                c++;
            })
            
        // pie chart
        } else if (chart_style == 'pie') {
            sector = [];
            start_angle = 0;
            end_angle = 0;
            var x1,x2,y1,y2 = 0;
            total = 0;
            pie_data=[];
            
            $.each(data[0],function(key_index,key_value) { pie_data.push(key_value);})
            
            for(var k=0; k < pie_data.length; k++){
                total += pie_data[k];
            }
            for(var i=0; i < pie_data.length; i++){
                var angle = Math.ceil(360 * pie_data[i]/total);
                sector.push(angle);
            }
            
            path = svg.createPath();
            chart_height+= offsetX;
            
            for(var i=0; i <sector.length; i++){
                start_angle = end_angle;
                end_angle = start_angle + sector[i];
                
                var large_arc_flag=0;
                if (sector[i]>180) {large_arc_flag = 1;}

                x1 = parseInt(chart_width/2 + chart_height *0.35*Math.cos(Math.PI*start_angle/180));                
                x2 = parseInt(chart_width/2 + chart_height *0.35*Math.cos(Math.PI*end_angle/180));
              
                y1 = parseInt(chart_height/2 + chart_height *0.35*Math.sin(Math.PI*start_angle/180));
                y2 = parseInt(chart_height/2 + chart_height *0.35*Math.sin(Math.PI*end_angle/180));                
                
                svg.path(path.move(chart_width/2,chart_height/2).line(x1,y1).arc(chart_height *0.35,chart_height *0.35,0,large_arc_flag,1,x2,y2).close(),{'fill':colors[i] });
                path.reset();  
            }   
        }
        
        // null line        
        if (chart_style != 'pie') {
            var null_line = svg.group({stroke:'#666',strokeWidth:2,data_id:'null_line'});
            svg.line(null_line,0,chart_height+min_value_px-offsetY+offsetTitle,chart_width,chart_height+min_value_px-offsetY+offsetTitle);
        }
            
        // legend 
        if (legend) {
            var legend_box_size=20;
            var legend_box_offset=5;
            var legend_box_total_size=legend_box_size+legend_box_offset;
            
            for (c=0;c<data_keys.length;++c) {
                svg.rect(chart_width,legend_box_total_size*c+legend_box_size,legend_box_size,legend_box_size,{fill:colors[c]});
                svg.text(text_style,chart_width+legend_box_total_size,legend_box_total_size*c+legend_box_total_size+(legend_box_size/2),data_keys[c]);
            }            
        } else {
            $('#' + container_name).css({'padding-right':offsetY}); //decrease container size, if legend=false
        }
        
        // data table
        if(table) {
            c=0;
            // handle the table-height
            if (chart_style == 'pie') {
                $('#' + container_name).css({'padding-bottom':(font_size*data.length)*2 + font_size*2});  
            } else {
                $('#' + container_name).css({'padding-bottom':(font_size*data.length)*2});  
            }
            
            // create the table
            $('#' + container_name).append('<table style='+
                                            'font-family:\'Arial\';'+
                                            'text-align:center'+
                                            ';width:' +  $('#' + container_name).css('width') + ';'+
                                            'border-collapse:collapse;'+
                                            'table-layout:fixed;'+
                                            'border:1px solid black;"'+
                                            ' id="'+container_name+'_table">');
            $('#' + container_name+'_table').append('<tr style="font-size:'+(font_size+2)+'px" id=header_'+container_name+'></tr>');
            
            
            // create series columns for some charts
            if (chart_style != 'single_bar' && chart_style != 'pie' ) {
                data_keys.unshift('Series');
                $('#' + 'header_'+container_name).append('<th style="border: 1px solid black;background:#666;color:white">' + 
                                                        data_keys.join('</th><th style="border: 1px solid black;background:#666;color:black">') + 
                                                        '</th>');
            } else {
                $('#' + 'header_'+container_name).append('<th style="border: 1px solid black;">'+data_keys.join('</th><th style="border: 1px solid black;background:#666;color:black">') + '</th>');
            }
            
            // recolor the th-cell's 
            $.each($('#' + container_name + ' th'),function(th_index,th_value) {
                if (chart_style != 'single_bar' && chart_style != 'pie'  ) {
                    if(th_index > 0) { $(th_value).css('background',colors[th_index-1]);}
                } else {
                   $(th_value).css('background',colors[th_index]);
                }
            });
            
            // create the td-cell's
            if (chart_style != 'single_bar' && chart_style != 'pie' ) { data_keys.shift(); }
            $.each(data,function(data_index,data_value) {
                $('#' + container_name+"_table").append('<tr style="background:#ccc;font-size:'+font_size+'px" id=' + c + '_' + container_name + '></tr>');                
                if (chart_style != 'single_bar' && chart_style != 'pie' ) {
                    $('#' + c + '_' + container_name ).append('<td style="color:white;border:1px solid black;background:#666">' + series[c]  + '</td>');    
                }
                $.each(data_keys,function(i,v){
                    if (chart_style == 'single_bar' && c < 1) {
                        $('#'+ c + '_' + container_name ).append('<td style="border: 1px solid black;">' + data[data_index][v]  + '</td>');
                    } else if (chart_style != 'single_bar') {
                        $('#'+ c + '_' + container_name ).append('<td style="border: 1px solid black;">' + data[data_index][v]  + '</td>');
                    }
                });
                c++;
            });
        }
        
        if (chart_style != 'pie') {
            // axis lines
            var out_lines = svg.group({stroke:'black',strokeWidth:3,data_id:'out_lines'});
            svg.line(out_lines,0+offsetX,0+offsetTitle,0+offsetX,chart_height-offsetY+offsetTitle);
            svg.line(out_lines,0+offsetX,chart_height-offsetY+offsetTitle,chart_width,chart_height-offsetY+offsetTitle);
        }
    }
    
    // get the max oder min vlaue of a data-structure
    function get_max_or_min (data,max_or_min) {
        var stored_values = []
        for (i = 0; i < data.length+1; ++i) {
            for (var key in data[i]) {
                stored_values.push(data[i][key]);
            }
        }
        if (max_or_min == 'max') {
            return Math.max(...stored_values);
        } else if (max_or_min == 'min') {
            return Math.min(...stored_values);
        } 
        return 0;
    }
}



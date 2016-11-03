# ajax-table.1.0
It is simply a jquery plugin for displaying data in a table

```javascript
/* general use */
	$('#some-selector').ajaxGridLite({
		url: "some/data/url", /* json data format = {data:[],count:0}*/
		columns: [
            {data:"Name"},
            {data:"Price"},
		]
	});
```

## lists of options

Options | Value | Descriptions
---|---|---
*init* | `false or false` | initially load the data or not
*sn*| `true or false` | print serial no from 1 to ...
*url*| `path/to/url`| data url

###columns: [] matching header from data
```javascript
use1:
	columns:[
		{data:"FName"},
		{data:"LName"},
	]
use2:
	columns:[
		{data:"FName"},
		{data:"LName"},
		{mRender: function (row) {
			//return custom html
		}}
	]
	
use3:
	columns:[
		{data:"FName"},
		{
			data:"LName",
			attr:'style="width:100px;"' /* custom attribute to td */
		},
		{
			mRender: function (row) {
				//return custom html
			},
			attr:'cellspaging = "1" cellpadding = "1"'
		}
	]	
  ```
*Options* | `Value` | Descriptions
---|---|---
*goPagination*| `true or false` |provides the number input page no field
*numberPagination* | `true or false` | normal 1,2,3 pagination
*beforeNextRow* | ```function(row){ // something} or false```|option for giving header for row
*noRecord*| `"Some message"` | some no record found message
*filter* | `true or false` | no of record per page changing options. if true then we have limitOption: [5, 10, 20, 50, 100] // 5, 10 ... are the records per page
*previous*| `"some text"` | previous button text
*next* | `"some text"` | next button text
*loadMore* | `true or false` | load more button pagination

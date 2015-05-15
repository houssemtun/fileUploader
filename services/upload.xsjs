/**
@author i809764 
**/

$.import("sap.hana.xs.libs.dbutils","xsds");
var XSDS = $.sap.hana.xs.libs.dbutils.xsds;

var conn = $.hdb.getConnection();
var pstmt1;

/**
@function Reads a table and returns JSON
@param {string} tblName - Table Name
@returns {object} recordSetJSON object with the result set as JSON
*/
function getJSON(tblName){
	tblName = typeof tblName !== 'undefined' ? tblName : 'schemas'; 
	var table = XSDS.$defineEntity("table", tblName);
	
	
	return table.$query().execute();
}

/**
@function Executes a single statement in the database
@param {string} query - Query to send to DB
*/
function execute(query) {
	pstmt1 = conn.prepareStatement(query);
	pstmt1.execute();
}


/**  
@function Outputs the Session user and Language as JSON in the Response body
*/
function fillSessionInfo(){
	var body = '';
	body = JSON.stringify({
		"session" : [{"UserName": $.session.getUsername(), "Language": $.session.language}] 
	});
	$.response.contentType = 'application/json'; 
	$.response.setBody(body);
	$.response.status = $.net.http.OK;
}

/**
@function Puts a JSON object into the Response Object
@param {object} jsonOut - JSON Object
*/
function outputJSON(jsonOut){
	var out = [];
	for(var i=0; i<jsonOut.length;i++){
		out.push(jsonOut[i]);
	}
	$.response.status = $.net.http.OK;
	$.response.contentType = "application/json";
	$.response.setBody(JSON.stringify(out));
}

/**
@function Utility to build error message response
@param {string} input - Error message text
*/
function outputError(errorString){
	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	$.response.contentType = "text/plain";
	$.response.setBody(errorString);	
}

/**
@function Get request parameter schema and select all Schemas matching that pattern
*/
function getSchemas(){
	var searchSchema = $.request.parameters.get("schema");
	if (typeof searchSchema === 'undefined') {
		searchSchema = "%";
	} else {
		searchSchema += "%";
	}
	
    var query = 'SELECT * from SCHEMAS ' +
    ' WHERE SCHEMA_NAME LIKE ? ' +
    ' ORDER BY SCHEMA_NAME ' +
    ' LIMIT 10 ';
    outputJSON(conn.executeQuery(query, searchSchema));
}

/**
@function Public function to read all tables and return JSON results
*/
function getTables(){
	
	outputJSON(getTablesInt(200));	
}

/**
@function Private function to read all tables and return JSON results; reads schema and table from request object
@param {optional Number} limit - Max number of Tables to read
@returns {object} jsonOut - JSON Object for return recordset
*/
function getTablesInt(limit){
	var searchSchema = $.request.parameters.get("schema");
	var searchTable = $.request.parameters.get("table");
	if (typeof searchTable === 'undefined') {
		searchTable = "%";
	} else {
		searchTable += "%";
	}

    var query = 'SELECT SCHEMA_NAME, TABLE_NAME, TO_NVARCHAR(TABLE_OID) AS TABLE_OID, COMMENTS  from TABLES ' +
    ' WHERE SCHEMA_NAME = ? ' +
    '   AND TABLE_NAME LIKE ? ' +
    ' ORDER BY TABLE_NAME ';
    if (limit != null){
		query += 'LIMIT ' + limit.toString();
	}

    var jsonOut = conn.executeQuery(query, searchSchema, searchTable);
	return jsonOut;
}

/**
@function Private function to read details of a single table and return JSON results
@param {Integer} table_oid - internal id for the table
@returns {object} jsonOut - JSON Object for return recordset
*/
function getTableInt(table_oid){

    var query = 'SELECT * from TABLES ' +
    ' WHERE TABLE_OID = ? ';
    var jsonOut = conn.executeQuery(query, table_oid);
    var out = [];
	for(var i=0; i<jsonOut.length;i++){
		out.push(jsonOut[i]);
	}
    return jsonOut;
}

/**
@function Public function to read details of a single table and return JSON results; Reads table_oid from request object
*/
function getTable(){
	var table_oid = $.request.parameters.get("table_oid");
	if(table_oid == null){
		outputError('Invalid source table');
		return;
	}
	outputJSON(getTableInt(table_oid));	
}

function getPackages(){
	var searchPackage = $.request.parameters.get("package");
	if (typeof searchPackage === 'undefined') {
		searchPackage = "%";
	} else {
		searchPackage += "%";
	}
	
	var query = 'SELECT TOP 200 "PACKAGE_ID" FROM "_SYS_REPO"."PACKAGE_CATALOG" '+
	            '   WHERE "PACKAGE_ID" LIKE ? ORDER BY "PACKAGE_ID" ';
	var jsonOut = conn.executeQuery(query,searchPackage);
	outputJSON(jsonOut);
	
}

function str2ab(str) {
	  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
	  var bufView = new Uint16Array(buf);
	  for (var i=0, strLen=str.length; i<strLen; i++) {
	    bufView[i] = str.charCodeAt(i);
	  }
	  return buf; 
}

function uploadFileToRepo(){  // No longer needed. Replaced with frontend call to the REPO API 

 	$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
	$.response.setBody('No longer implemented on the server. Please use the DT REST interface call instead');
	
	/*//I809764 - works now on SP7	
 try{
	
     var fileName = $.request.parameters.get('FileName');
     var repoPath = $.request.parameters.get('RepoPath');
     
     // read request body
     var content = $.request.entities[0].body.asString();
     //open db connection needed for repository sessions
     var conn = $.db.getConnection(8);
     // create object id (object to write to)
     var objectId = $.repo.createObjectId("",repoPath,fileName,'txt');
     // create empty metadata
     var metadata = $.repo.createInactiveMetadata();
     // create inactive session
     var inactiveSession = $.repo.createInactiveSession(conn, "workspaceName");
     // write inactive object
     var writtenObjectMetadata = $.repo.writeObject(inactiveSession, objectId, metadata, content);
     // activate the object
     var activateResult = $.repo.activateObjects(inactiveSession,[objectId], $.repo.ACTIVATION_CASCADE_ONE_PHASE);
     //commit the changes
     conn.commit();
     //close db connection
     conn.close();    

     
         var content = "";
     for (var i = 0; i < $.request.entities.length; ++i) {
        if (i==0) {
            content = $.request.entities[i].body.asArrayBuffer();
        }
     }

     var conn = $.db.getConnection(8);
     var fileName = $.request.parameters.get('FileName');
     var repoPath = $.request.parameters.get('RepoPath');

         // create object id (object to write to)
      var objectId = $.repo.createObjectId("",repoPath,fileName,'html');
         
         // write to repository object
      var activeSession = $.repo.createActiveSession(conn);
      var metadata = $.repo.readObjectMetadata(activeSession,objectId);
      var inactiveSession = $.repo.createInactiveSession(conn,"workspaceName");
      var writtenObjectMetadata = $.repo.writeObject(inactiveSession, objectId, metadata, content);
      var activateResult = $.repo.activateObjects(inactiveSession,[ objectId ], $.repo.ACTIVATION_FORCE);     	
 	  conn.commit();
      conn.close();     
     
     $.response.contentType = 'text/plain';
     $.response.status = $.net.http.OK;
    }catch(err){
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(err.message);
    }	 */
 
}

function uploadFileToTable(){
	 
    var content = "";
    content = $.request.body.asArrayBuffer();
    var array = new Uint8Array(content);
    var encodedString = String.fromCharCode.apply(null,array),
         decodedString = decodeURIComponent(escape(encodedString));
        content = decodedString;

    var lines = content.split(/\r\n|\n/);
    
    var fileName = $.request.parameters.get('FileName');
    var tableName = $.request.parameters.get('TableName');
    var schemaName = $.request.parameters.get('SchemaName');


    try{
    	var rs;
    	var parameters;
       	
        // Truncate table
        var query = 'TRUNCATE TABLE "'+ schemaName +'"."' + tableName +'"'; 
        conn.executeUpdate(query);
    	conn.commit();   
            	
    	
   // Get one line, and determine number  of columns to pass to INSERT statement
       	var data = lines[0].split(',');
        for (var j=0; j<data.length; j++) {
        	if (j==0){
        		parameters = '?';
        	}else{
        	    parameters = parameters + ',?';
        	}
        } 	
  
   // Create SQL string
        var query = 'INSERT into "'+ schemaName +'"."' + tableName + '" values(' + parameters + ')';
       
   // Now prepare statement and insert values      
        var argsArray=[];
        for (var i=0; i<lines.length; i++) {
	    	var line = [];
         	var data = lines[i].split(',');
	    	for (var x=0; x<data.length; x++) {
	         
	    	 line[line.length] = data[x];	
	    	}
	    	argsArray[argsArray.length] = line;
    	}  
    	
        conn.executeUpdate(query, argsArray)
    	conn.commit();
	 	
    	
     $.response.contentType = 'text/plain';
     $.response.status = $.net.http.OK;
     $.response.setBody = 'Sucessfully uploaded';     
    }catch(err){
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody(err.message);
    }	 
 
}

	var aCmd = $.request.parameters.get('cmd');
	switch (aCmd) {
	case "uploadFileToRepo":
		uploadFileToRepo();
		break;
	case "uploadFileToTable":
		uploadFileToTable();
		break;
	case "getSchemas":
		getSchemas();
		break;
	case "getTables":
		getTables();
		break;
	case "getTable":
		getTable();
		break;
	case "getSessionInfo":
		fillSessionInfo();
		break;	
	case "getPackages":
		getPackages();
		break;		
	default:
		$.response.status = $.net.http.INTERNAL_SERVER_ERROR;
		$.response.setBody('Invalid Command');
	}

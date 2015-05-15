sap.ui.controller("views.App", {
	tablesJSON : null,	
    onInit: function(){
    	 var view = this.getView();
         view.addStyleClass("sapUiSizeCompact"); // make everything inside this View appear in Compact mode
         view.byId("Schema").setFilterFunction(this.getView().getController().filterFunction);
         view.byId("Table").setFilterFunction(this.getView().getController().filterFunction);    	
 
    }, 
   
    filterFunction: function(sTerm, oItem) {
        if (sTerm === "*") {
            return true;
        } else {
            return jQuery.sap.startsWithIgnoreCase(oItem.getText(), sTerm);
        }
    },    
    
    toggleFields: function(oEvent){
        var oConfig = sap.ui.getCore().getModel("config"); 
        var selectedItem = oEvent.mParameters.selectedIndex;
        if(selectedItem == 0){
        	oConfig.setProperty("/TableVisible",true);  
        	oConfig.setProperty("/RepoVisible",false);  
        	oConfig.setProperty("/fileType","txt,csv");
        }else{
        	oConfig.setProperty("/TableVisible",false);  
        	oConfig.setProperty("/RepoVisible",true); 
        	oConfig.setProperty("/fileType","");        	
        }
        var oModel = sap.ui.getCore().getModel(); 
        oModel.setProperty("/fileUpload","");
    },
    
    handleTypeMissmatch: function(oEvent) {

        var aFileTypes = oEvent.getSource().getFileType();
        $.each(aFileTypes, function(key, value) {aFileTypes[key] = "*." +  value});
        var sSupportedFileTypes = aFileTypes.join(", ");
        sap.m.MessageToast.show("The file type *." + oEvent.getParameter("fileType") +
                    " is not supported. Choose one of the following types: " +
                    sSupportedFileTypes);
    },
    
  //Schema Filter
	 loadSchemaFilter: function(oEvent){
		   var oController = this.getView().getController();
		   var gSearchParam = oEvent.getParameter("suggestValue");
		   if(typeof(gSearchParam) != 'undefined'){
			   if(gSearchParam == "*"){gSearchParam="";}
		   }
		   else{ gSearchParam = "";}	
		    var aUrl = ShortUrl + '?cmd=getSchemas&schema='+escape(gSearchParam);
		    jQuery.ajax({
		       url: aUrl,
		       method: 'GET',
		       dataType: 'json',
		       success: oController.onLoadSchemaFilter,
		       error: oController.onErrorCall });
	 },	 
	 onLoadSchemaFilter: function(myJSON){
		  var oSearchControl = sap.ui.getCore().byId("app--Schema"); 
		  oSearchControl.destroySuggestionItems();
		  for( var i = 0; i<myJSON.length; i++)
		     {
			  oSearchControl.addSuggestionItem(new sap.ui.core.Item({
				  text: myJSON[i].SCHEMA_NAME
		     }));
	      }
	},
	 
		//Table Filter
		 loadTableFilter: function(oEvent){
			   var oController = this.getView().getController();
			   var oModel = sap.ui.getCore().getModel();			   
			   gSearchParam = oEvent.getParameter("suggestValue");
			   if(typeof(gSearchParam) != 'undefined'){
				   if(gSearchParam == "*"){gSearchParam="";}
			   }
			   else{ gSearchParam = "";}
			   
			   schemaName = oModel.getProperty("/Schema");
			    var aUrl = ShortUrl + '?cmd=getTables&schema='+escape(schemaName)+'&table='+gSearchParam;
			    jQuery.ajax({
			       url: aUrl,
			       method: 'GET',
			       dataType: 'json',
			       success: oController.onLoadTableFilter,
			       error: oController.onErrorCall });
		 },		 
		 onLoadTableFilter: function(myJSON){
			   var oController = sap.ui.getCore().byId("app").getController();
			   oController.tablesJSON = myJSON;
			  var oSearchControl = sap.ui.getCore().byId("app--Table");
			  oSearchControl.destroySuggestionItems();
			  for( var i = 0; i<myJSON.length; i++)
			     {
				  oSearchControl.addSuggestionItem(new sap.ui.core.Item({text: myJSON[i].TABLE_NAME}))

			     }
			}, 
	
			//Package Filter
		    loadPackageFilter: function(oEvent) {
		        var oController = this.getView().getController();
		        var gSearchParam = oEvent.getParameter("suggestValue");
		        var aUrl = ShortUrl + '?cmd=getPackages&package=' + escape(gSearchParam);
		        jQuery.ajax({
		            url: aUrl,
		            method: "GET",
		            dataType: "json",
		            success: oController.onLoadPackageFilter,
		            error: oController.onErrorCall
		        });

		    },
		    onLoadPackageFilter: function(myJSON) {
		        var oSearchControl = sap.ui.getCore().byId("app--Package");
		        oSearchControl.destroySuggestionItems();
		        for (var i = 0; i < myJSON.length; i++) {
		            oSearchControl.addSuggestionItem(new sap.ui.core.Item({
		                text: myJSON[i].PACKAGE_ID
		            }));
		        }
		    },
		    
		    handleUploadPress: function(){
				var oController = this.getView().getController();
				var oModel = sap.ui.getCore().getModel();
		    	var oConfig = sap.ui.getCore().getModel("config");
		    	var fileName = oModel.getProperty("/fileUpload");
	    	    var oFileUploader = sap.ui.getCore().byId("app--fileUploader");
	    	    
		    	if(oConfig.getProperty("/TableVisible")){ 
		    		//Table Upload
		    		var schemaName = oModel.getProperty("/Schema");
		    		var tableName = oModel.getProperty("/Table");
		    		oFileUploader.setUploadUrl(ShortUrl+'?cmd=uploadFileToTable'+
							'&FileName='+escape(fileName)+
							'&SchemaName='+escape(schemaName)+
							'&TableName='+escape(tableName));
		    		oFileUploader.destroyHeaderParameters();
		    	    oFileUploader.addHeaderParameter( 
		    	    		new sap.ui.unified.FileUploaderParameter({
    	                        name: 'X-CSRF-Token',
    	                        value: getCSRFToken()
    	                       }));			    		
					//oFileUploader.attachUploadComplete(oEvent, oController.handleUploadComplete(oEvent,oController) );
					oFileUploader.upload();
		    		
		    	}else{
		    		//Repository Upload
		    		var repoName = oModel.getProperty("/Repo");
		    		var shortUrl = "/sap/hana/xs/dt/base/file/";
		    	    var path = repoName.replace(/[.]/g, "/");
		    	    var url = shortUrl + path;
		    	    	url += "/" + fileName;
		    	    var oSapBackPack = {};
		    	        oSapBackPack.Workspace = "__empty__";
		    	        oSapBackPack.Activate = true;
		    	    var sapBackPack = JSON.stringify(oSapBackPack);	
		    	    var formEle = jQuery.sap.domById("app--fileUploader");
		    	    var form = $(formEle).find("form")[0];
		    	    var fd = new FormData(form);
                    var ajaxCall = jQuery.ajax({
                       url : url,
                       type : 'PUT',
                       processData: false,
                       contentType: false,
                       data : fd,
             
                       headers : {
                              "SapBackPack" : sapBackPack,
                              "X-CSRF-Token" : getCSRFToken()
                       },
                       async: false 
                });	
                
                
		    	}
		    },

		    handleUploadComplete: function(oEvent) {
		        var sResponse = oEvent.getParameter("responseRaw");
		        var status = oEvent.getParameter("status")
		        if (status) {
		          var sMsg = "";
		          //var m = /^\[(\d\d\d)\]:(.*)$/.exec(sResponse);
		          if (status == "200") {
		            sMsg = "Upload Successful!", "SUCCESS", "Upload Success";
		            oEvent.getSource().setValue("");
		            sap.m.MessageToast.show(sMsg);
		          } else {
		            sMsg = "Return Code: " + status + "\n" +sResponse, "ERROR", "Upload Error";
		            sap.m.MessageBox.alert(sMsg);		            
		          }
		        }
		      },		    
    onErrorCall: function(jqXHR) {
        if (jqXHR.responseText === "NaN") {
            sap.m.MessageBox.alert("Invalid Input Value");
        } else {
            sap.m.MessageBox.alert(escape(jqXHR.responseText) );
        }
        return;
    }    
});    
jQuery.sap.declare("sap.xsopen.fileUploader.Component");


sap.ui.core.UIComponent.extend("sap.xsopen.fileUploader.Component", {
	init: function(){
		jQuery.sap.require("sap.m.MessageBox");
		jQuery.sap.require("sap.m.MessageToast");		
		
		//Configuration Model
	     var oConfig = new sap.ui.model.json.JSONModel({});
        sap.ui.getCore().setModel(oConfig, "config"); 
        this.getSessionInfo();
        oConfig.setProperty("/TableVisible",true);  
        oConfig.setProperty("/RepoVisible",false); 
        oConfig.setProperty("/fileType",'txt,csv');  
        
        //Main Model
		  var model = new sap.ui.model.json.JSONModel({});
        model.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);		
        sap.ui.getCore().setModel(model);  
      
        // set i18n model
  		var i18nModel = new sap.ui.model.resource.ResourceModel({
  			bundleUrl : "./i18n/messagebundle.hdbtextbundle"
  		});
  		sap.ui.getCore().setModel(i18nModel, "i18n");  
	          
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
	},
	
	createContent: function() {
     
		var settings = {
				ID: "fileUploader",
				title: "File Uploader Example",
				description: "File Uploader Example",
			};
		
		var oView = sap.ui.view({
			id: "app",
			viewName: "views.App",
			type: "XML",
			viewData: settings
		});
		
		 oView.setModel(sap.ui.getCore().getModel("i18n"), "i18n");
		 oView.setModel(sap.ui.getCore().getModel("config"), "config");		 
		 oView.setModel(sap.ui.getCore().getModel()); 		 
		return oView;
	},
	
	getSessionInfo: function(){
		var aUrl = '/sap/hana/xsopen/fileUploader/services/upload.xsjs?cmd=getSessionInfo';
	    this.onLoadSession(
	    		JSON.parse(jQuery.ajax({
	    		       url: aUrl,
	    		       method: 'GET',
	    		       dataType: 'json',
	    		       async: false}).responseText));	    
	 
	},
	
	onLoadSession: function(myJSON){
		for( var i = 0; i<myJSON.session.length; i++)
	     {
		   var config =  sap.ui.getCore().getModel("config");
		   config.setProperty("/UserName",myJSON.session[i].UserName);
	     }
	}	
});
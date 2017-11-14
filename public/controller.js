
var app = angular.module("serviceApp",[]);
// var app = app();

app.controller('controller', function ($scope,$window,$http) {
	$http.get("https://octopusexcelacom-developer-edition.ap5.force.com/services/apexrest/Lead").success(function(response) {
				 $scope.json = response;
       			 });


$scope.addName = function(){
                                var inputJson={"LeadType":$scope.LeadType,"Status":$scope.Status,"FirstName":$scope.FirstName,"LastName":$scope.LastName,"Rating":$scope.Rating,"BusinessPhoneNumber":$scope.BusinessPhoneNumber,"Email":$scope.Email,"WinProbability":$scope.WinProbability};
                                $http.post("https://octopusexcelacom-developer-edition.ap5.force.com/services/apexrest/Lead",inputJson).success(function(response) {

						location.reload();

                                                console.log("Created successfully");
                                                 });
                }





	


$scope.updateName = function(){
                                var inputJson={"Id":$scope.Id,"LeadType":$scope.LeadType,"Status":$scope.Status,"FirstName":$scope.FirstName,"LastName":$scope.LastName,"Rating":$scope.Rating,"BusinessPhoneNumber":$scope.BusinessPhoneNumber,"Email":$scope.Email,"WinProbability":$scope.WinProbability};
                                $http.put("https://octopusexcelacom-developer-edition.ap5.force.com/services/apexrest/Lead",inputJson).success(function(response) {

						location.reload();

                                                console.log("Deleted successfully");
                                                 });
                }


$scope.deleteName = function(){
                               
                                $http.delete("https://octopusexcelacom-developer-edition.ap5.force.com/services/apexrest/Lead/"+$scope.Id).success(function(response) {

						location.reload();

                                                console.log("Deleted successfully");
                                                 });
                }





	
})











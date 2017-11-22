
var app = angular.module("serviceApp",[]);
// var app = app();

app.controller('controller', function ($scope,$window,$http) {
	$http.get("http://34.234.47.41:1200/get").success(function(response) {
				 $scope.json = response;
       			 });


$scope.addName = function(){
                                var inputJson={"leadtype":$scope.leadtype,"status":$scope.status,"firstname":$scope.firstname,"lastname":$scope.lastname,"rating":$scope.rating,"businessphoneNumber":$scope.businessphoneNumber,"email":$scope.email,"winprobability":$scope.winprobability};
                                $http.post("http://34.234.47.41:1200/createSales",inputJson).success(function(response) {

						location.reload();

                                                console.log("Created successfully");
                                                 });
                }





	


$scope.updateName = function(){
                                var inputJson={"Id":$scope.Id,"leadtype":$scope.leadtype,"status":$scope.status,"firstname":$scope.firstname,"lastname":$scope.lastname,"rating":$scope.rating,"businessphoneNumber":$scope.businessphoneNumber,"email":$scope.email,"winprobability":$scope.winprobability};
                                $http.put("http://34.234.47.41:1200/updateSales",inputJson).success(function(response) {

						location.reload();

                                                console.log("Updated successfully");
                                                 });
                }


$scope.deleteName = function(){
                               
                                $http.delete("http://34.234.47.41:1200/deleteSales/"+$scope.Id).success(function(response) {

						location.reload();

                                                console.log("Deleted successfully");
                                                 });
                }





	
})











(function() {
  'use strict';

  angular
    .module('app')
    .controller('RegisterController', RegisterController);

  RegisterController.$inject = ['UserService', '$location', '$rootScope', 'FlashService', '$scope'];

  function RegisterController(UserService, $location, $rootScope, FlashService, $scope) {

    $scope.register = register;

    function register() {
      $scope.dataLoading = true;
      UserService.Create($scope.user)
        .then(function(response) {
          if (response.success) {
            FlashService.Success('Registration successful', true);
            $location.path('/login');
          } else {
            FlashService.Error(response.message);
            $scope.dataLoading = false;
          }
        });
    }
  }

})();

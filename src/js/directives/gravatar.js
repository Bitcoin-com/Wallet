'use strict';

angular.module('copayApp.directives')
  .directive('gravatar', function(md5, $http) {
    return {
      restrict: 'AE',
      replace: true,
      scope: {
        name: '@',
        height: '@',
        width: '@',
        email: '@',
        url: '@'
      },
      link: function(scope, el, attr) {
        if (typeof scope.email === "string") {
          scope.emailHash = md5.createHash(scope.email.toLowerCase() || '');
          var req = {
            method: 'GET',
            url: 'https://secure.gravatar.com/'+scope.emailHash+'.json',
          };
          scope.url = 'img/contact-placeholder.svg';
          $http(req).then(function (response) {
            scope.url = 'https://secure.gravatar.com/avatar/'+scope.emailHash+'.jpg?s='+scope.width+'&d=mm';
          }, function (error) {
            scope.url = 'img/contact-placeholder.svg';
          });
        }
      },
      template: '<img class="gravatar" alt="{{ name }}" height="{{ height }}"  width="{{ width }}" src="{{ url }}">'
    };
  });

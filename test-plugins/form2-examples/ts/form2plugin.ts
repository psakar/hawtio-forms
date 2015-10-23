/// <reference path="../../includes.ts"/>

module Forms2Tests {
  var pluginName = 'hawtio-forms2-tests';
  var log:Logging.Logger = Logger.get(pluginName);
  var _module = angular.module(pluginName, []);

  _module.run(["SchemaRegistry", function(schemas) {
    schemas.addSchema('testObject', {
      "description": "Object from registry",
      properties: {
        "Attr1": {
          "type": "number",
          "label": "Attribute 1"
        }
      }
    });

    schemas.addSchema('ArrayObject', {
      description: 'Some object with a username and password',
      javaType: 'com.foo.ArrayObject',
      properties: {
        "Field1": {
          "type": "string",
          "label": "Username",
          "input-attributes": {
            placeholder: "Username..."
          }
        },
        "Field2": {
          "type": "password",
          "label": "Password",
          "input-attributes": {
            placeholder: "Password..."
          }
        },
        "Field3": {
          "type": "string",
          "label": "Type",
          "enum": {
            "label1": "value1",
            "label2": "value2",
            "label3": "value3"
          }
        }
      }
    });

    schemas.addSchema('StringArray', {
      description: 'Array of strings',
      properties: {
        values: {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      }
    });

    schemas.addSchema('ObjectWithArrayObject', {
      desription: 'Some object with an embedded object',
      javaType: 'com.foo.ObjectWithArrayObject',
      properties: {
        arg1: {
          type: 'string'
        },
        arg2: {
          type: 'ArrayObject'
        }
      }
    });
  }]);

  var baseConfig = {
      "id": 'myForm',
      "style": HawtioForms.FormStyle.HORIZONTAL,
      "mode": HawtioForms.FormMode.EDIT,
      "disableHumanizeLabel": false,
      hideLegend: false,
      "properties": {
        "booleanThing": {
          "type": "boolean",
          "default": "true"
        },
        "fromSchemaRegistry": {
          "type": "testObject"
        },
        "SelectWithConfig": {
          type: 'text',
          enum: [{
            value: 'A Value 1',
            label: 'A Label 1',
            attributes: {
              title: 'A title 1'
            }
          }, {
            value: 'A Value 2',
            label: 'A Label 2',
            attributes: {
              title: 'A title 2'
            }
          }, {
            value: 'A Value 3',
            label: 'A Label 3',
            attributes: {
              title: 'A title 3'
            }
          }, {
            value: 'A Value 4',
            label: 'A Label 4',
            attributes: {
              title: 'A title 4'
            }
          }]
        },
        "LongObjectSelect": {
          type: "java.lang.String",
          enum: {
            "label1": "value1",
            "label2": "value2",
            "label3": "value3",
            "label4": "value4",
            "label5": "value5",
            "label6": "value6",
            "label7": "value7",
            "label8": "value8"
          },
          default: "value3"
        },
        "key": {
          "label": "The Argument",
          "type": "java.lang.String",
          "description": "Enter the argument key",
          "input-attributes": {
            "value": "This is an initial value",
            "placeholder": "Enter in some value"
          },
          "control-group-attributes": {
            "ng-show": "entity.booleanArg == true"
          }
        },
        "InputWithTypeahead": {
          type: 'text',
          typeaheadData: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
          'input-attributes': {
            'typeahead': 'number for number in config.properties.InputWithTypeahead.typeaheadData'
          }
        },
        "RequiredThing": {
          type: 'text',
          'input-attributes': {
            'required': 'true'
          }
        },
        array1: {
          items: {
            type: 'string'
          },
          type: 'array'
        },
        array2: {
          items: {
            type: 'number'
          },
          type: 'array'
        },
        array3: {
          items: {
            type: 'ArrayObject'
          },
          type: 'array'
        },
        scheme: {
          type: "java.lang.String",
          tooltip: "HTTP or HTTPS",
          enum: ["http", "https"],
          default: "http",
        },
        nestedObject: {
          style: HawtioForms.FormStyle.HORIZONTAL,
          label: "A Nested Object",
          type: 'object',
          properties: {
            'Attribute1': {
              type: 'text',
              'label-attributes': {
                'style': 'color: green'
              }
            },
            'Attribute2': {
              type: 'java.lang.Integer',
              label: 'A Number'
            } 
          }
        },
        "ObjectSelect": {
          type: "java.lang.String",
          enum: {
            "label1": "value1",
            "label2": "value2",
            "label3": "value3"
          },
          default: "value3"
        },
        "value": {
          "description": "Enter the argument value",
          "label": "The Value",
          "type": "java.lang.String",
          "tooltip": "This is the tooltip",
          "input-attributes": {
            "placeholder": "Hello World!",
            "value": "This is also an initial value"
          }
        },
        "staticText": {
          "type": "static",
          "description": "This is some static text, use this type to add a description in your form that's properly formatted"
        },
        "templatedThing": {
          "formTemplate": "<p class=\"alert alert-info\">Hi, I'm a custom template and I like warm hugs!</p>"
        },
        "passwordField": {
          "type": "password",
          "input-attributes": {
            placeholder: "Password..."
          }
        },
        "longArg": {
          "description": "Long argument",
          "type": "Long",
          "label-attributes": {
            "style": "color: red"
          },
          "input-attributes": {
            "min": "5",
            "max": "10"
          }
        },
        "intArg": {
          "description": "Int argument",
          "type": "Integer",
          "hidden": true,
          "input-attributes": {
            "value": 5
          }
        },
        "booleanArg": {
          "description": "Toggles whether or not you want to enter the argument key",
          "type": "java.lang.Boolean"
        }
      },
      "description": "This is my awesome form",
      "type": "java.lang.String"
    };

    var baseModel ={
      "scheme": "http",
      "array1": ["foo", "bar", "cheese"],
      "array2": [
        20,
        13
      ],
      "array3": [
        {
          "Field1": "test1",
          "Field2": "test1",
          "Field3": "value2"
        },
        {
          "Field1": "test2",
          "Field2": "test2",
          "Field3": "value3"
        }, 
        {
          "Field1": "test3",
          "Field2": "test3",
          "Field3": "value1"
        } 
      ]
    };

  _module.controller("HawtioFormsTests.Forms2Controller", ["$scope", "$templateCache", "SchemaRegistry", function($scope, $templateCache, schemas) {
    var config:any = _.clone(baseConfig, true);
    config.controls = ["scheme", "nestedObject", "fromSchemaRegistry", "*", "array2", "array1"];
    $scope.config = config;
    var model = _.clone(baseModel, true);
    $scope.model = model;
    $scope.configStr = angular.toJson($scope.config, true);
    $scope.markup = $templateCache.get("markup.html");
    $scope.$watch('model', _.debounce(function() {
      $scope.modelStr = angular.toJson($scope.model, true);
      Core.$apply($scope);
    }, 500), true);
    $scope.$watch('configStr', _.debounce(function() {
      try {
        $scope.config = angular.fromJson($scope.configStr);
        log.debug("Updated config ...");
        Core.$apply($scope);
      } catch (e) {
      }
    }, 1000));
  }]);


  hawtioPluginLoader.addModule(pluginName);
}


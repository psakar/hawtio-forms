/// <reference path="../libs/hawtio-ui/defs.d.ts"/>

/// <reference path="../../includes.ts"/>
/**
 * @module Forms
 */
var Forms;
(function (Forms) {
    Forms.log = Logger.get("Forms");
    /**
     * Default any values in the schema on the entity if they are not already present
     * @method defaultValues
     * @param {any} entity
     * @param {any} schema
     */
    function defaultValues(entity, schema) {
        if (entity && schema) {
            angular.forEach(schema.properties, function (property, key) {
                var defaultValue = property.default;
                if (defaultValue && !entity[key]) {
                    console.log("===== defaulting value " + defaultValue + " into entity[" + key + "]");
                    entity[key] = defaultValue;
                }
            });
        }
    }
    Forms.defaultValues = defaultValues;
    /**
     * If the type name refers to an alias in the schemas definitions then perform the lookup and return the real type name
     * @method resolveTypeNAmeAlias
     * @param {String} type
     * @param {any} schema
     *
     */
    function resolveTypeNameAlias(type, schema) {
        if (type && schema) {
            var alias = lookupDefinition(type, schema);
            if (alias) {
                var realType = alias["type"];
                if (realType) {
                    type = realType;
                }
            }
        }
        return type;
    }
    Forms.resolveTypeNameAlias = resolveTypeNameAlias;
    /**
     * Walks the base class hierarchy checking if the given type is an instance of the given type name
     * @method isJsonType
     * @param {String} name
     * @param {any} schema
     * @param {String} typeName
     * @return {Boolean}
     */
    function isJsonType(name, schema, typeName) {
        var definition = lookupDefinition(name, schema);
        while (definition) {
            var extendsTypes = Core.pathGet(definition, ["extends", "type"]);
            if (extendsTypes) {
                if (typeName === extendsTypes) {
                    return true;
                }
                else {
                    definition = lookupDefinition(extendsTypes, schema);
                }
            }
            else {
                return false;
            }
        }
        return false;
    }
    Forms.isJsonType = isJsonType;
    /**
     * Removes any dodgy characters for a valid identifier in angularjs such as for '-' characters
     * which are replaced with '_'
     * @method safeIdentifier
     * @param {String} id
     * @return {String}
     */
    function safeIdentifier(id) {
        if (id) {
            return id.replace(/-/g, "_");
        }
        return id;
    }
    Forms.safeIdentifier = safeIdentifier;
    /**
     * Looks up the given type name in the schemas definitions
     * @method lookupDefinition
     * @param {String} name
     * @param {any} schema
     */
    function lookupDefinition(name, schema) {
        if (schema) {
            var defs = schema.definitions;
            if (defs) {
                var answer = defs[name];
                if (answer) {
                    var fullSchema = answer["fullSchema"];
                    if (fullSchema) {
                        return fullSchema;
                    }
                    // we may extend another, if so we need to copy in the base properties
                    var extendsTypes = Core.pathGet(answer, ["extends", "type"]);
                    if (extendsTypes) {
                        fullSchema = angular.copy(answer);
                        fullSchema.properties = fullSchema.properties || {};
                        if (!angular.isArray(extendsTypes)) {
                            extendsTypes = [extendsTypes];
                        }
                        angular.forEach(extendsTypes, function (extendType) {
                            if (angular.isString(extendType)) {
                                var extendDef = lookupDefinition(extendType, schema);
                                var properties = Core.pathGet(extendDef, ["properties"]);
                                if (properties) {
                                    angular.forEach(properties, function (property, key) {
                                        fullSchema.properties[key] = property;
                                    });
                                }
                            }
                        });
                        answer["fullSchema"] = fullSchema;
                        return fullSchema;
                    }
                }
                return answer;
            }
        }
        return null;
    }
    Forms.lookupDefinition = lookupDefinition;
    /**
     * For an array property, find the schema of the items which is either nested inside this property
     * in the 'items' property; or the type name is used to lookup in the schemas definitions
     * @method findArrayItemsSchema
     * @param {String} property
     * @param {any} schema
     */
    function findArrayItemsSchema(property, schema) {
        var items = null;
        if (property && schema) {
            items = property.items;
            if (items) {
                var typeName = items["type"];
                if (typeName) {
                    var definition = lookupDefinition(typeName, schema);
                    if (definition) {
                        return definition;
                    }
                }
            }
            // are we a json schema properties with a link to the schema doc?
            var additionalProperties = property.additionalProperties;
            if (additionalProperties) {
                if (additionalProperties["$ref"] === "#") {
                    return schema;
                }
            }
        }
        return items;
    }
    Forms.findArrayItemsSchema = findArrayItemsSchema;
    /**
     * Returns true if the given schema definition is an object
     * @method isObjectType
     * @param {any} definition
     */
    function isObjectType(definition) {
        var typeName = Core.pathGet(definition, "type");
        return typeName && "object" === typeName;
    }
    Forms.isObjectType = isObjectType;
    /**
     * Returns true if the given property represents a nested object or array of objects
     * @method isArrayOrNestedObject
     * @param {any} property
     * @param {any} schema
     */
    function isArrayOrNestedObject(property, schema) {
        if (property) {
            var propType = resolveTypeNameAlias(property["type"], schema);
            if (propType) {
                if (propType === "object" || propType === "array") {
                    return true;
                }
            }
        }
        return false;
    }
    Forms.isArrayOrNestedObject = isArrayOrNestedObject;
    function configure(config, scopeConfig, attrs) {
        if (angular.isDefined(scopeConfig)) {
            config = angular.extend(config, scopeConfig);
        }
        return angular.extend(config, attrs);
    }
    Forms.configure = configure;
    function getControlGroup(config, arg, id) {
        var rc = angular.element('<div class="' + config.controlgroupclass + '"></div>');
        if (angular.isDefined(arg.description)) {
            rc.attr('title', arg.description);
        }
        // log.debug("getControlGroup, config:", config, " arg: ", arg, " id: ", id);
        if (config['properties'] && config['properties'][id]) {
            var elementConfig = config['properties'][id];
            // log.debug("elementConfig: ", elementConfig);
            if (elementConfig && 'control-attributes' in elementConfig) {
                angular.forEach(elementConfig['control-attributes'], function (value, key) {
                    rc.attr(key, value);
                });
            }
        }
        return rc;
    }
    Forms.getControlGroup = getControlGroup;
    function getLabel(config, arg, label) {
        return angular.element('<label class="' + config.labelclass + '">' + label + '</label>');
    }
    Forms.getLabel = getLabel;
    function getControlDiv(config) {
        return angular.element('<div class="' + config.controlclass + '"></div>');
    }
    Forms.getControlDiv = getControlDiv;
    function getHelpSpan(config, arg, id) {
        var help = Core.pathGet(config.data, ['properties', id, 'help']);
        if (!Core.isBlank(help)) {
            return angular.element('<span class="help-block">' + help + '</span>');
        }
        else {
            return angular.element('<span class="help-block"></span>');
        }
    }
    Forms.getHelpSpan = getHelpSpan;
})(Forms || (Forms = {}));

/**
 * @module Forms
 */
///<reference path="formHelpers.ts"/>
var Forms;
(function (Forms) {
    /**
     * Create a DOM widget tree for the given set of form configuration data.
     *
     * This will include either the standard AngularJS widgets or custom widgets
     */
    function createWidget(propTypeName, property, schema, config, id, ignorePrefixInLabel, configScopeName, wrapInGroup, disableHumanizeLabel) {
        if (wrapInGroup === void 0) { wrapInGroup = true; }
        if (disableHumanizeLabel === void 0) { disableHumanizeLabel = false; }
        var input = null;
        var group = null;
        function copyElementAttributes(element, propertyName) {
            var propertyAttributes = property[propertyName];
            if (propertyAttributes) {
                angular.forEach(propertyAttributes, function (value, key) {
                    if (angular.isString(value)) {
                        element.attr(key, value);
                    }
                });
            }
        }
        function copyAttributes() {
            copyElementAttributes(input, "input-attributes");
            angular.forEach(property, function (value, key) {
                if (angular.isString(value) && key.indexOf("$") < 0 && key !== "type") {
                    var html = Core.escapeHtml(value);
                    input.attr(key, html);
                }
            });
        }
        var options = {
            valueConverter: null
        };
        var safeId = Forms.safeIdentifier(id);
        var inputMarkup = createStandardWidgetMarkup(propTypeName, property, schema, config, options, safeId);
        if (inputMarkup) {
            input = angular.element(inputMarkup);
            copyAttributes();
            id = safeId;
            var modelName = config.model || Core.pathGet(property, ["input-attributes", "ng-model"]);
            if (!modelName) {
                modelName = config.getEntity() + "." + id;
            }
            input.attr("ng-model", modelName);
            input.attr('name', id);
            try {
                if (config.isReadOnly()) {
                    input.attr('readonly', 'true');
                }
            }
            catch (e) {
            }
            var title = property.tooltip || property.label;
            if (title) {
                input.attr('title', title);
            }
            var disableHumanizeLabelValue = disableHumanizeLabel || property.disableHumanizeLabel;
            // allow the prefix to be trimmed from the label if enabled
            var defaultLabel = id;
            if (ignorePrefixInLabel || property.ignorePrefixInLabel) {
                var idx = id.lastIndexOf('.');
                if (idx > 0) {
                    defaultLabel = id.substring(idx + 1);
                }
            }
            // figure out which things to not wrap in a group and label etc...
            if (input.attr("type") !== "hidden" && wrapInGroup) {
                group = this.getControlGroup(config, config, id);
                var labelText = property.title || property.label || (disableHumanizeLabelValue ? defaultLabel : Core.humanizeValue(defaultLabel));
                var labelElement = Forms.getLabel(config, config, labelText);
                if (title) {
                    labelElement.attr('title', title);
                }
                group.append(labelElement);
                copyElementAttributes(labelElement, "label-attributes");
                var controlDiv = Forms.getControlDiv(config);
                controlDiv.append(input);
                controlDiv.append(Forms.getHelpSpan(config, config, id));
                group.append(controlDiv);
                // allow control level directives, such as ng-show / ng-hide
                copyElementAttributes(controlDiv, "control-attributes");
                copyElementAttributes(group, "control-group-attributes");
                var scope = config.scope;
                if (scope && modelName) {
                    var onModelChange = function (newValue) {
                        scope.$emit("hawtio.form.modelChange", modelName, newValue);
                    };
                    var fn = onModelChange;
                    // allow custom converters
                    var converterFn = options.valueConverter;
                    if (converterFn) {
                        fn = function () {
                            converterFn(scope, modelName);
                            var newValue = Core.pathGet(scope, modelName);
                            onModelChange(newValue);
                        };
                    }
                    scope.$watch(modelName, fn);
                }
            }
        }
        else {
            input = angular.element('<div></div>');
            input.attr(Forms.normalize(propTypeName, property, schema), '');
            copyAttributes();
            input.attr('entity', config.getEntity());
            input.attr('mode', config.getMode());
            var fullSchemaName = config.schemaName;
            if (fullSchemaName) {
                input.attr('schema', fullSchemaName);
            }
            if (configScopeName) {
                input.attr('data', configScopeName);
            }
            if (ignorePrefixInLabel || property.ignorePrefixInLabel) {
                input.attr('ignore-prefix-in-label', true);
            }
            if (disableHumanizeLabel || property.disableHumanizeLabel) {
                input.attr('disable-humanize-label', true);
            }
            input.attr('name', id);
        }
        var label = property.label;
        if (label) {
            input.attr('title', label);
        }
        // TODO check for id in the schema["required"] array too!
        // as required can be specified either via either of these approaches
        /*
            var schema = {
              required: ["foo", "bar"],
              properties: {
                something: {
                  required: true,
                  type: "string"
                }
              }
            }
        */
        if (property.required) {
            // don't mark checkboxes as required
            if (input[0].localName === "input" && input.attr("type") === "checkbox") {
            }
            else {
                input.attr('required', 'true');
            }
        }
        return group ? group : input;
    }
    Forms.createWidget = createWidget;
    /**
     * Lets try create the standard angular JS widgets markup
     * @method createStandardWidgetMarkup
     * @param {String} propTypeName
     * @param {any} property
     * @param {any} schema
     * @param {any} config
     * @param {any} options
     * @param {String} id
     */
    function createStandardWidgetMarkup(propTypeName, property, schema, config, options, id) {
        // lets try use standard widgets first...
        var type = Forms.resolveTypeNameAlias(propTypeName, schema);
        if (!type) {
            return '<input type="text" class="form-group"/>';
        }
        var custom = Core.pathGet(property, ["formTemplate"]);
        if (custom) {
            return null;
        }
        var inputElement = Core.pathGet(property, ["input-element"]);
        if (inputElement) {
            return "<" + inputElement + "></" + inputElement + ">";
        }
        var enumValues = Core.pathGet(property, ["enum"]);
        if (enumValues) {
            var required = true;
            var valuesScopeName = null;
            var attributes = "";
            if (enumValues) {
                // calculate from input attributes...
                var scope = config.scope;
                var data = config.data;
                if (data && scope) {
                    // this is a big ugly - would be nice to expose this a bit easier...
                    // maybe nested objects should expose the model easily...
                    var fullSchema = scope[config.schemaName];
                    var model = angular.isString(data) ? scope[data] : data;
                    // now we need to keep walking the model to find the enum values
                    var paths = id.split(".");
                    var property = null;
                    angular.forEach(paths, function (path) {
                        property = Core.pathGet(model, ["properties", path]);
                        var typeName = Core.pathGet(property, ["type"]);
                        var alias = Forms.lookupDefinition(typeName, fullSchema);
                        if (alias) {
                            model = alias;
                        }
                    });
                    var values = Core.pathGet(property, ["enum"]);
                    valuesScopeName = "$values_" + id.replace(/\./g, "_");
                    scope[valuesScopeName] = values;
                }
            }
            if (valuesScopeName) {
                attributes += ' ng-options="value for value in ' + valuesScopeName + '"';
            }
            var defaultOption = required ? "" : '<option value=""></option>';
            return '<select' + attributes + '>' + defaultOption + '</select>';
        }
        if (angular.isArray(type)) {
            // TODO union of tabbed forms such as Marshal / Unmarshal in camel...
            return null;
        }
        if (!angular.isString(type)) {
            return null;
        }
        var defaultValueConverter = null;
        var defaultValue = property.default;
        if (defaultValue) {
            // lets add a default value
            defaultValueConverter = function (scope, modelName) {
                var value = Core.pathGet(scope, modelName);
                if (!value) {
                    Core.pathSet(scope, modelName, property.default);
                }
            };
            options.valueConverter = defaultValueConverter;
        }
        function getModelValueOrDefault(scope, modelName) {
            var value = Core.pathGet(scope, modelName);
            if (!value) {
                var defaultValue = property.default;
                if (defaultValue) {
                    value = defaultValue;
                    Core.pathSet(scope, modelName, value);
                }
            }
            return value;
        }
        switch (type.toLowerCase()) {
            case "int":
            case "integer":
            case "long":
            case "short":
            case "java.lang.integer":
            case "java.lang.long":
            case "float":
            case "double":
            case "java.lang.float":
            case "java.lang.double":
                // lets add a value conversion watcher...
                options.valueConverter = function (scope, modelName) {
                    var value = getModelValueOrDefault(scope, modelName);
                    if (value && angular.isString(value)) {
                        var numberValue = Number(value);
                        Core.pathSet(scope, modelName, numberValue);
                    }
                };
                return '<input type="number" class="form-input"/>';
            case "array":
            case "java.lang.array":
            case "java.lang.iterable":
            case "java.util.list":
            case "java.util.collection":
            case "java.util.iterator":
            case "java.util.set":
            case "object[]":
                // no standard markup for these types
                return null;
            case "boolean":
            case "bool":
            case "java.lang.boolean":
                // lets add a value conversion watcher...
                options.valueConverter = function (scope, modelName) {
                    var value = getModelValueOrDefault(scope, modelName);
                    if (value && "true" === value) {
                        //console.log("coercing String to boolean for " + modelName);
                        Core.pathSet(scope, modelName, true);
                    }
                };
                return '<input type="checkbox" class="form-input"/>';
            case "password":
                return '<input type="password" class="form-input"/>';
            case "hidden":
                return '<input type="hidden" class="form-input"/>';
            case "map":
                return null;
            default:
                // lets check if this name is an alias to a definition in the schema
                return '<input type="text" class="form-input"/>';
        }
    }
    Forms.createStandardWidgetMarkup = createStandardWidgetMarkup;
    function mapType(type) {
        switch (type.toLowerCase()) {
            case "int":
            case "integer":
            case "long":
            case "short":
            case "java.lang.integer":
            case "java.lang.long":
            case "float":
            case "double":
            case "java.lang.float":
            case "java.lang.double":
                return "number";
            case "array":
            case "java.lang.array":
            case "java.lang.iterable":
            case "java.util.list":
            case "java.util.collection":
            case "java.util.iterator":
            case "java.util.set":
            case "object[]":
                return "text";
            case "boolean":
            case "bool":
            case "java.lang.boolean":
                return "checkbox";
            case "password":
                return "password";
            case "hidden":
                return "hidden";
            default:
                return "text";
        }
    }
    Forms.mapType = mapType;
    function normalize(type, property, schema) {
        type = Forms.resolveTypeNameAlias(type, schema);
        if (!type) {
            return "hawtio-form-text";
        }
        var custom = Core.pathGet(property, ["formTemplate"]);
        if (custom) {
            return "hawtio-form-custom";
        }
        var enumValues = Core.pathGet(property, ["enum"]);
        if (enumValues) {
            // TODO could use different kinds of radio / combo box
            return "hawtio-form-select";
        }
        if (angular.isArray(type)) {
            // TODO union of tabbed forms such as Marshal / Unmarshal in camel...
            return null;
        }
        if (!angular.isString(type)) {
            try {
                console.log("Unsupported JSON schema type value " + JSON.stringify(type));
            }
            catch (e) {
                console.log("Unsupported JSON schema type value " + type);
            }
            return null;
        }
        switch (type.toLowerCase()) {
            case "int":
            case "integer":
            case "long":
            case "short":
            case "java.lang.integer":
            case "java.lang.long":
            case "float":
            case "double":
            case "java.lang.float":
            case "java.lang.double":
                return "hawtio-form-number";
            case "array":
            case "java.lang.array":
            case "java.lang.iterable":
            case "java.util.list":
            case "java.util.collection":
            case "java.util.iterator":
            case "java.util.set":
            case "object[]":
                var items = property.items;
                if (items) {
                    var typeName = items.type;
                    if (typeName && typeName === "string") {
                        return "hawtio-form-string-array";
                    }
                }
                else {
                    // let's use the string array if no type is set,
                    // at least that provides a form of some kind
                    return "hawtio-form-string-array";
                }
                Forms.log.debug("Returning hawtio-form-array for : ", property);
                return "hawtio-form-array";
            case "boolean":
            case "bool":
            case "java.lang.boolean":
                return "hawtio-form-checkbox";
            case "password":
                return "hawtio-form-password";
            case "hidden":
                return "hawtio-form-hidden";
            case "map":
                return "hawtio-form-map";
            default:
                // lets check if this name is an alias to a definition in the schema
                return "hawtio-form-text";
        }
    }
    Forms.normalize = normalize;
})(Forms || (Forms = {}));

/**
 * @module Forms
 */
/// <reference path="../../includes.ts"/>
/// <reference path="mappingRegistry.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Forms;
(function (Forms) {
    /**
     * @class InputBaseConfig
      */
    var InputBaseConfig = (function () {
        function InputBaseConfig() {
            this.name = 'input';
            this.type = '';
            this.description = '';
            this._default = '';
            this.scope = null;
            // Can also be 'view'
            this.mode = 'edit';
            // the name of the full schema
            this.schemaName = "schema";
            this.controlgroupclass = 'control-group';
            this.controlclass = 'controls';
            this.labelclass = 'control-label';
            this.showtypes = 'false';
            /**
             * Custom template for custom form controls
             * @property
             * @type String
             */
            this.formtemplate = null;
            /**
             * the name of the attribute in the scope which is the data to be edited
             * @property
             * @type String
             */
            this.entity = 'entity';
            /**
             * the model expression to bind to. If omitted this defaults to entity + "." + name
             * @property
             * @type String
             */
            this.model = undefined;
        }
        InputBaseConfig.prototype.getEntity = function () {
            return this.entity || "entity";
        };
        InputBaseConfig.prototype.getMode = function () {
            return this.mode || "edit";
        };
        InputBaseConfig.prototype.isReadOnly = function () {
            return this.getMode() === "view";
        };
        return InputBaseConfig;
    })();
    Forms.InputBaseConfig = InputBaseConfig;
    var InputBase = (function () {
        function InputBase($compile) {
            var _this = this;
            this.$compile = $compile;
            this.restrict = 'A';
            this.scope = true;
            this.replace = false;
            this.transclude = false;
            this.attributeName = '';
            // necessary to ensure 'this' is this object <sigh>
            this.link = function (scope, element, attrs) {
                return _this.doLink(scope, element, attrs);
            };
        }
        InputBase.prototype.doLink = function (scope, element, attrs) {
            var config = new InputBaseConfig;
            config = Forms.configure(config, null, attrs);
            config.scope = scope;
            config.schemaName = attrs["schema"] || "schema";
            var id = Forms.safeIdentifier(config.name);
            var group = this.getControlGroup(config, config, id);
            var modelName = config.model;
            if (!angular.isDefined(modelName)) {
                // TODO always use 2 way binding?
                modelName = config.getEntity() + "." + id;
            }
            // allow the prefix to be trimmed from the label
            var defaultLabel = id;
            if ("true" === attrs["ignorePrefixInLabel"]) {
                var idx = id.lastIndexOf('.');
                if (idx > 0) {
                    defaultLabel = id.substring(idx + 1);
                }
            }
            var disableHumanizeLabel = "true" === attrs["disableHumanizeLabel"];
            var labelText = attrs["title"] || (disableHumanizeLabel ? defaultLabel : Core.humanizeValue(defaultLabel));
            group.append(Forms.getLabel(config, config, labelText));
            var controlDiv = Forms.getControlDiv(config);
            controlDiv.append(this.getInput(config, config, id, modelName));
            controlDiv.append(Forms.getHelpSpan(config, config, id));
            group.append(controlDiv);
            $(element).append(this.$compile(group)(scope));
            if (scope && modelName) {
                scope.$watch(modelName, onModelChange);
            }
            function onModelChange(newValue) {
                scope.$emit("hawtio.form.modelChange", modelName, newValue);
            }
        };
        InputBase.prototype.getControlGroup = function (config1, config2, id) {
            return Forms.getControlGroup(config1, config2, id);
        };
        InputBase.prototype.getInput = function (config, arg, id, modelName) {
            var rc = $('<span class="form-data"></span>');
            if (modelName) {
                rc.attr('ng-model', modelName);
                rc.append('{{' + modelName + '}}');
            }
            return rc;
        };
        return InputBase;
    })();
    Forms.InputBase = InputBase;
    var TextInput = (function (_super) {
        __extends(TextInput, _super);
        function TextInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
            this.type = "text";
        }
        /*public getControlGroup(config1, config2, id) {
          return super.getControlGroup(config1, config2, id);
        }*/
        TextInput.prototype.getInput = function (config, arg, id, modelName) {
            if (config.isReadOnly()) {
                return _super.prototype.getInput.call(this, config, arg, id, modelName);
            }
            var rc = $('<input type="' + this.type + '">');
            rc.attr('name', id);
            if (modelName) {
                rc.attr('ng-model', modelName);
            }
            if (config.isReadOnly()) {
                rc.attr('readonly', 'true');
            }
            var required = config.$attr["required"];
            if (required && required !== "false") {
                rc.attr('required', 'true');
            }
            return rc;
        };
        return TextInput;
    })(InputBase);
    Forms.TextInput = TextInput;
    var HiddenText = (function (_super) {
        __extends(HiddenText, _super);
        function HiddenText($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
            this.type = "hidden";
        }
        HiddenText.prototype.getControlGroup = function (config1, config2, id) {
            var group = _super.prototype.getControlGroup.call(this, config1, config2, id);
            group.css({ 'display': 'none' });
            return group;
        };
        HiddenText.prototype.getInput = function (config, arg, id, modelName) {
            var rc = _super.prototype.getInput.call(this, config, arg, id, modelName);
            rc.attr('readonly', 'true');
            return rc;
        };
        return HiddenText;
    })(TextInput);
    Forms.HiddenText = HiddenText;
    var PasswordInput = (function (_super) {
        __extends(PasswordInput, _super);
        function PasswordInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
            this.type = "password";
        }
        return PasswordInput;
    })(TextInput);
    Forms.PasswordInput = PasswordInput;
    var CustomInput = (function (_super) {
        __extends(CustomInput, _super);
        function CustomInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
        }
        CustomInput.prototype.getInput = function (config, arg, id, modelName) {
            var template = arg.formtemplate;
            template = Core.unescapeHtml(template);
            var rc = $(template);
            if (!rc.attr("name")) {
                rc.attr('name', id);
            }
            if (modelName) {
                rc.attr('ng-model', modelName);
            }
            if (config.isReadOnly()) {
                rc.attr('readonly', 'true');
            }
            return rc;
        };
        return CustomInput;
    })(InputBase);
    Forms.CustomInput = CustomInput;
    var SelectInput = (function (_super) {
        __extends(SelectInput, _super);
        function SelectInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
        }
        SelectInput.prototype.getInput = function (config, arg, id, modelName) {
            if (config.isReadOnly()) {
                return _super.prototype.getInput.call(this, config, arg, id, modelName);
            }
            // TODO calculate from input attributes...
            var required = true;
            // TODO we could configure the null option...
            var defaultOption = required ? "" : '<option value=""></option>';
            var rc = $('<select>' + defaultOption + '</select>');
            rc.attr('name', id);
            var scope = config.scope;
            var data = config.data;
            if (data && scope) {
                // this is a big ugly - would be nice to expose this a bit easier...
                // maybe nested objects should expose the model easily...
                var fullSchema = scope[config.schemaName];
                var model = scope[data];
                // now we need to keep walking the model to find the enum values
                var paths = id.split(".");
                var property = null;
                angular.forEach(paths, function (path) {
                    property = Core.pathGet(model, ["properties", path]);
                    var typeName = Core.pathGet(property, ["type"]);
                    var alias = Forms.lookupDefinition(typeName, fullSchema);
                    if (alias) {
                        model = alias;
                    }
                });
                var values = Core.pathGet(property, ["enum"]);
                scope["$selectValues"] = values;
                rc.attr("ng-options", "value for value in $selectValues");
            }
            if (modelName) {
                rc.attr('ng-model', modelName);
            }
            if (config.isReadOnly()) {
                rc.attr('readonly', 'true');
            }
            return rc;
        };
        return SelectInput;
    })(InputBase);
    Forms.SelectInput = SelectInput;
    var NumberInput = (function (_super) {
        __extends(NumberInput, _super);
        function NumberInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
        }
        NumberInput.prototype.getInput = function (config, arg, id, modelName) {
            if (config.isReadOnly()) {
                return _super.prototype.getInput.call(this, config, arg, id, modelName);
            }
            var rc = $('<input type="number">');
            rc.attr('name', id);
            if (angular.isDefined(arg.def)) {
                rc.attr('value', arg.def);
            }
            if (angular.isDefined(arg.minimum)) {
                rc.attr('min', arg.minimum);
            }
            if (angular.isDefined(arg.maximum)) {
                rc.attr('max', arg.maximum);
            }
            if (modelName) {
                rc.attr('ng-model', modelName);
            }
            if (config.isReadOnly()) {
                rc.attr('readonly', 'true');
            }
            // lets coerce any string values to numbers so that they work properly with the UI
            var scope = config.scope;
            if (scope) {
                function onModelChange() {
                    var value = Core.pathGet(scope, modelName);
                    if (value && angular.isString(value)) {
                        var numberValue = Number(value);
                        Core.pathSet(scope, modelName, numberValue);
                    }
                }
                scope.$watch(modelName, onModelChange);
                onModelChange();
            }
            return rc;
        };
        return NumberInput;
    })(InputBase);
    Forms.NumberInput = NumberInput;
    /**
     * Generates a list of strings which can be added / edited / removed
     * @class StringArrayInput
     */
    var StringArrayInput = (function (_super) {
        __extends(StringArrayInput, _super);
        function StringArrayInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
        }
        StringArrayInput.prototype.getInput = function (config, arg, id, modelName) {
            var rowScopeName = "_" + id;
            var ngRepeat = rowScopeName + ' in ' + modelName;
            var readOnlyWidget = '{{' + rowScopeName + '}}';
            if (config.isReadOnly()) {
                return angular.element('<ul><li ng-repeat="' + rowScopeName + ' in ' + modelName + '">' + readOnlyWidget + '</li></ul>');
            }
            else {
                // TODO there should be an easier way to find the property / schema!
                var scope = config.scope;
                var fallbackSchemaName = (arg.$attr || {})["schema"] || "schema";
                var schema = scope[config.schemaName] || scope[fallbackSchemaName] || {};
                var properties = schema.properties || {};
                var arrayProperty = properties[id] || {};
                // lets refer to the property of the item, rather than the array
                var property = arrayProperty["items"] || {};
                var propTypeName = property.type;
                var ignorePrefixInLabel = true;
                var disableHumanizeLabel = property.disableHumanizeLabel;
                var configScopeName = null;
                // lets create an empty array if its not yet set
                var value = Core.pathGet(scope, modelName);
                if (!value) {
                    Core.pathSet(scope, modelName, []);
                }
                var methodPrefix = "_form_stringArray" + rowScopeName + "_";
                var itemKeys = methodPrefix + "keys";
                var addMethod = methodPrefix + "add";
                var removeMethod = methodPrefix + "remove";
                // we maintain a separate object of all the keys (indices) of the array
                // and use that to lookup the values
                function updateKeys() {
                    var value = Core.pathGet(scope, modelName);
                    scope[itemKeys] = value ? Object.keys(value) : [];
                    scope.$emit("hawtio.form.modelChange", modelName, value);
                }
                updateKeys();
                scope[addMethod] = function () {
                    var value = Core.pathGet(scope, modelName) || [];
                    value.push("");
                    Core.pathSet(scope, modelName, value);
                    updateKeys();
                };
                scope[removeMethod] = function (idx) {
                    var value = Core.pathGet(scope, modelName) || [];
                    if (idx < value.length) {
                        value.splice(idx, 1);
                    }
                    Core.pathSet(scope, modelName, value);
                    updateKeys();
                };
                // the expression for an item value
                var itemId = modelName + "[" + rowScopeName + "]";
                var itemsConfig = {
                    model: itemId
                };
                var wrapInGroup = false;
                var widget = Forms.createWidget(propTypeName, property, schema, itemsConfig, itemId, ignorePrefixInLabel, configScopeName, wrapInGroup, disableHumanizeLabel);
                if (!widget) {
                    widget = angular.element(readOnlyWidget);
                }
                var markup = angular.element('<div class="controls" style="white-space: nowrap" ng-repeat="' + rowScopeName + ' in ' + itemKeys + '"></div>');
                markup.append(widget);
                markup.append(angular.element('<a ng-click="' + removeMethod + '(' + rowScopeName + ')" title="Remove this value"><i class="red icon-remove"></i></a>'));
                markup.after(angular.element('<a ng-click="' + addMethod + '()" title="Add a new value"><i class="icon-plus"></i></a>'));
                return markup;
            }
        };
        return StringArrayInput;
    })(InputBase);
    Forms.StringArrayInput = StringArrayInput;
    var ArrayInput = (function (_super) {
        __extends(ArrayInput, _super);
        function ArrayInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
        }
        ArrayInput.prototype.doLink = function (scope, element, attrs) {
            var config = new InputBaseConfig;
            config = Forms.configure(config, null, attrs);
            var id = config.name;
            var dataName = attrs["data"] || "";
            var entityName = attrs["entity"] || config.entity;
            var schemaName = attrs["schema"] || config.schemaName;
            function renderRow(cell, type, data) {
                if (data) {
                    var description = data["description"];
                    if (!description) {
                        angular.forEach(data, function (value, key) {
                            if (value && !description) {
                                description = value;
                            }
                        });
                    }
                    return description;
                }
                return null;
            }
            // Had to fudge some of this
            // create a table UI!
            var tableConfigPaths = ["properties", id, "inputTable"];
            //var scope = config.scope;
            var tableConfig = null;
            Core.pathGet(scope, tableConfigPaths);
            // lets auto-create a default configuration if there is none
            if (!tableConfig) {
                // TODO ideally we should merge this config with whatever folks have hand-defined
                var tableConfigScopeName = tableConfigPaths.join(".");
                //var cellDescription = a["description"] || humanizeValue(id);
                var disableHumanizeLabel = "true" === attrs["disableHumanizeLabel"];
                var cellDescription = disableHumanizeLabel ? id : Core.humanizeValue(id);
                tableConfig = {
                    formConfig: config,
                    title: cellDescription,
                    data: config.entity + "." + id,
                    displayFooter: false,
                    showFilter: false,
                    columnDefs: [
                        {
                            field: '_id',
                            displayName: cellDescription,
                            render: renderRow
                        }
                    ]
                };
                Core.pathSet(scope, tableConfigPaths, tableConfig);
            }
            var table = $('<div hawtio-input-table="' + tableConfigScopeName + '" data="' + dataName + '" property="' + id + '" entity="' + entityName + '" schema="' + schemaName + '"></div>');
            if (config.isReadOnly()) {
                table.attr("readonly", "true");
            }
            $(element).append(this.$compile(table)(scope));
        };
        return ArrayInput;
    })(InputBase);
    Forms.ArrayInput = ArrayInput;
    var BooleanInput = (function (_super) {
        __extends(BooleanInput, _super);
        function BooleanInput($compile) {
            _super.call(this, $compile);
            this.$compile = $compile;
        }
        BooleanInput.prototype.getInput = function (config, arg, id, modelName) {
            var rc = $('<input class="hawtio-checkbox" type="checkbox">');
            rc.attr('name', id);
            if (config.isReadOnly()) {
                rc.attr('disabled', 'true');
            }
            if (modelName) {
                rc.attr('ng-model', modelName);
            }
            if (config.isReadOnly()) {
                rc.attr('readonly', 'true');
            }
            // lets coerce any string values to boolean so that they work properly with the UI
            var scope = config.scope;
            if (scope) {
                function onModelChange() {
                    var value = Core.pathGet(scope, modelName);
                    if (value && "true" === value) {
                        //console.log("coercing String to boolean for " + modelName);
                        Core.pathSet(scope, modelName, true);
                    }
                }
                scope.$watch(modelName, onModelChange);
                onModelChange();
            }
            return rc;
        };
        return BooleanInput;
    })(InputBase);
    Forms.BooleanInput = BooleanInput;
})(Forms || (Forms = {}));

/// <reference path="../../includes.ts"/>
var Forms;
(function (Forms) {
    Forms.pluginName = 'hawtio-forms';
    Forms.templateUrl = 'plugins/forms/html/';
    Forms.log = Logger.get(Forms.pluginName);
})(Forms || (Forms = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="formHelpers.ts"/>
/// <reference path="mappingRegistry.ts"/>
var Forms;
(function (Forms) {
    var SimpleFormConfig = (function () {
        function SimpleFormConfig() {
            this.name = 'form';
            this.method = 'post';
            // the name of the attribute in the scope which is the data to be edited
            this.entity = 'entity';
            // the name of the full schema
            this.schemaName = 'schema';
            // set to 'view' or 'create' for different modes
            this.mode = 'edit';
            // the definition of the form
            this.data = {};
            this.json = undefined;
            // the scope
            this.scope = null;
            // the name to look up in the scope for the configuration data
            this.scopeName = null;
            this.properties = [];
            this.action = '';
            this.formclass = 'hawtio-form form-horizontal no-bottom-margin';
            this.controlgroupclass = 'form-group';
            this.controlclass = 'col-sm-10';
            this.labelclass = 'col-sm-2 control-label';
            this.showtypes = 'false';
            this.onsubmit = 'onSubmit';
        }
        SimpleFormConfig.prototype.getMode = function () {
            return this.mode || "edit";
        };
        SimpleFormConfig.prototype.getEntity = function () {
            return this.entity || "entity";
        };
        SimpleFormConfig.prototype.isReadOnly = function () {
            return this.getMode() === "view";
        };
        return SimpleFormConfig;
    })();
    Forms.SimpleFormConfig = SimpleFormConfig;
    var SimpleForm = (function () {
        function SimpleForm($compile) {
            var _this = this;
            this.$compile = $compile;
            this.restrict = 'A';
            this.scope = true;
            this.replace = true;
            this.transclude = true;
            this.attributeName = 'simpleForm';
            // necessary to ensure 'this' is this object <sigh>
            this.link = function (scope, element, attrs) {
                return _this.doLink(scope, element, attrs);
            };
        }
        SimpleForm.prototype.isReadOnly = function () {
            return false;
        };
        SimpleForm.prototype.doLink = function (scope, element, attrs) {
            var config = new SimpleFormConfig;
            var fullSchemaName = attrs["schema"];
            var fullSchema = fullSchemaName ? scope[fullSchemaName] : null;
            var compiledNode = null;
            var childScope = null;
            var tabs = null;
            var fieldset = null;
            var schema = null;
            var configScopeName = attrs[this.attributeName] || attrs["data"];
            var firstControl = null;
            var simple = this;
            scope.$watch(configScopeName, onWidgetDataChange);
            function onWidgetDataChange(scopeData) {
                if (scopeData) {
                    onScopeData(scopeData);
                }
            }
            function onScopeData(scopeData) {
                config = Forms.configure(config, scopeData, attrs);
                config.schemaName = fullSchemaName;
                config.scopeName = configScopeName;
                config.scope = scope;
                var entityName = config.getEntity();
                if (angular.isDefined(config.json)) {
                    config.data = $.parseJSON(config.json);
                }
                else {
                    config.data = scopeData;
                }
                var form = simple.createForm(config);
                fieldset = form.find('fieldset');
                schema = config.data;
                tabs = {
                    elements: {},
                    locations: {},
                    use: false
                };
                if (schema && angular.isDefined(schema.tabs)) {
                    tabs.use = true;
                    tabs['div'] = $('<div class="tabbable hawtio-form-tabs"></div>');
                    angular.forEach(schema.tabs, function (value, key) {
                        tabs.elements[key] = $('<div class="tab-pane" title="' + key + '"></div>');
                        tabs['div'].append(tabs.elements[key]);
                        value.forEach(function (val) {
                            tabs.locations[val] = key;
                        });
                    });
                    if (!tabs.locations['*']) {
                        tabs.locations['*'] = _.keys(schema.tabs)[0];
                    }
                }
                if (!tabs.use) {
                    fieldset.append('<div class="spacer"></div>');
                }
                if (schema) {
                    // if we're using tabs lets reorder the properties...
                    if (tabs.use) {
                        var tabKeyToIdPropObject = {};
                        angular.forEach(schema.properties, function (property, id) {
                            var tabkey = findTabOrderValue(id);
                            var array = tabKeyToIdPropObject[tabkey];
                            if (!array) {
                                array = [];
                                tabKeyToIdPropObject[tabkey] = array;
                            }
                            array.push({ id: id, property: property });
                        });
                        // now lets iterate through each tab...
                        angular.forEach(schema.tabs, function (value, key) {
                            value.forEach(function (val) {
                                var array = tabKeyToIdPropObject[val];
                                if (array) {
                                    angular.forEach(array, function (obj) {
                                        var id = obj.id;
                                        var property = obj.property;
                                        if (id && property) {
                                            addProperty(id, property);
                                        }
                                    });
                                }
                            });
                        });
                    }
                    else {
                        angular.forEach(schema.properties, function (property, id) {
                            addProperty(id, property);
                        });
                    }
                }
                if (tabs.use) {
                    var tabDiv = tabs['div'];
                    var tabCount = Object.keys(tabs.elements).length;
                    if (tabCount < 2) {
                        // if we only have 1 tab lets extract the div contents of the tab
                        angular.forEach(tabDiv.children().children(), function (control) {
                            fieldset.append(control);
                        });
                    }
                    else {
                        fieldset.append(tabDiv);
                    }
                }
                var findFunction = function (scope, func) {
                    if (angular.isDefined(scope[func]) && angular.isFunction(scope[func])) {
                        return scope;
                    }
                    if (angular.isDefined(scope.$parent) && scope.$parent !== null) {
                        return findFunction(scope.$parent, func);
                    }
                    else {
                        return null;
                    }
                };
                var onSubmitFunc = config.onsubmit.replace('(', '').replace(')', '');
                var onSubmit = maybeGet(findFunction(scope, onSubmitFunc), onSubmitFunc);
                if (onSubmit === null) {
                    onSubmit = function (json, form) {
                        Forms.log.info("No submit handler defined for form:", form.get(0).name);
                    };
                }
                if (angular.isDefined(onSubmit)) {
                    form.submit(function () {
                        Forms.log.debug("child scope: ", childScope);
                        Forms.log.debug("form name: ", config);
                        if (childScope[config.name].$invalid) {
                            return false;
                        }
                        var entity = scope[entityName];
                        onSubmit(entity, form);
                        return false;
                    });
                }
                fieldset.append('<input type="submit" style="position: absolute; left: -9999px; width: 1px; height: 1px;">');
                // now lets try default an autofocus element onto the first item if we don't find any elements with an auto-focus
                var autoFocus = form.find("*[autofocus]");
                if (!autoFocus || !autoFocus.length) {
                    if (firstControl) {
                        console.log("No autofocus element, so lets add one!");
                        var input = firstControl.find("input").first() || firstControl.find("select").first();
                        if (input) {
                            input.attr("autofocus", "true");
                        }
                    }
                }
                if (compiledNode) {
                    $(compiledNode).remove();
                }
                if (childScope) {
                    childScope.$destroy();
                }
                childScope = scope.$new(false);
                compiledNode = simple.$compile(form)(childScope);
                // now lets expose the form object to the outer scope
                var formsScopeProperty = "forms";
                var forms = scope[formsScopeProperty];
                if (!forms) {
                    forms = {};
                    scope[formsScopeProperty] = forms;
                }
                var formName = config.name;
                if (formName) {
                    var formObject = childScope[formName];
                    if (formObject) {
                        forms[formName] = formObject;
                    }
                    var formScope = formName += "$scope";
                    forms[formScope] = childScope;
                }
                $(element).append(compiledNode);
            }
            function findTabKey(id) {
                var tabkey = tabs.locations[id];
                if (!tabkey) {
                    // lets try find a tab key using regular expressions
                    angular.forEach(tabs.locations, function (value, key) {
                        if (!tabkey && key !== "*" && id.match(key)) {
                            tabkey = value;
                        }
                    });
                }
                if (!tabkey) {
                    tabkey = tabs.locations['*'];
                }
                return tabkey;
            }
            function findTabOrderValue(id) {
                var answer = null;
                angular.forEach(schema.tabs, function (value, key) {
                    value.forEach(function (val) {
                        if (!answer && val !== "*" && id.match(val)) {
                            answer = val;
                        }
                    });
                });
                if (!answer) {
                    answer = '*';
                }
                return answer;
            }
            function addProperty(id, property, ignorePrefixInLabel) {
                if (ignorePrefixInLabel === void 0) { ignorePrefixInLabel = property.ignorePrefixInLabel; }
                // TODO should also support getting inputs from the template cache, maybe
                // for type="template"
                var propTypeName = property.type;
                // make sure we detect string as string
                if ("java.lang.String" === propTypeName) {
                    propTypeName = "string";
                }
                var propSchema = Forms.lookupDefinition(propTypeName, schema);
                if (!propSchema) {
                    propSchema = Forms.lookupDefinition(propTypeName, fullSchema);
                }
                var disableHumanizeLabel = schema ? schema.disableHumanizeLabel : false;
                // lets ignore fields marked as hidden from the generated form
                if (property.hidden) {
                    return;
                }
                var nestedProperties = null;
                if (!propSchema && "object" === propTypeName && property.properties) {
                    // if we've no type name but have nested properties on an object type use those
                    nestedProperties = property.properties;
                }
                else if (propSchema && Forms.isObjectType(propSchema)) {
                    // otherwise use the nested properties from the related schema type
                    //console.log("type name " + propTypeName + " has nested object type " + JSON.stringify(propSchema, null, "  "));
                    nestedProperties = propSchema.properties;
                }
                if (nestedProperties) {
                    angular.forEach(nestedProperties, function (childProp, childId) {
                        var newId = id + "." + childId;
                        addProperty(newId, childProp, property.ignorePrefixInLabel);
                    });
                }
                else {
                    var wrapInGroup = true;
                    var input = Forms.createWidget(propTypeName, property, schema, config, id, ignorePrefixInLabel, configScopeName, wrapInGroup, disableHumanizeLabel);
                    if (tabs.use) {
                        var tabkey = findTabKey(id);
                        tabs.elements[tabkey].append(input);
                    }
                    else {
                        fieldset.append(input);
                    }
                    if (!firstControl) {
                        firstControl = input;
                    }
                }
            }
            function maybeGet(scope, func) {
                if (scope !== null) {
                    return scope[func];
                }
                return null;
            }
        };
        SimpleForm.prototype.createForm = function (config) {
            var form = $('<form class="' + config.formclass + '" novalidate><fieldset></fieldset></form>');
            form.attr('name', config.name);
            form.attr('action', config.action);
            form.attr('method', config.method);
            form.find('fieldset').append(this.getLegend(config));
            return form;
        };
        SimpleForm.prototype.getLegend = function (config) {
            var description = Core.pathGet(config, "data.description");
            if (description) {
                return '<legend>' + description + '</legend>';
            }
            return '';
        };
        return SimpleForm;
    })();
    Forms.SimpleForm = SimpleForm;
})(Forms || (Forms = {}));

///<reference path="formHelpers.ts"/>
var Forms;
(function (Forms) {
    var InputTableConfig = (function () {
        function InputTableConfig() {
            this.name = 'form';
            this.method = 'post';
            // the name of the attribute in the scope which is the data to be editted
            this.entity = 'entity';
            // the name of the attribute in the scope which is the table configuration
            this.tableConfig = 'tableConfig';
            // set to 'view' or 'create' for different modes
            this.mode = 'edit';
            // the definition of the form
            this.data = {};
            this.json = undefined;
            this.properties = [];
            this.action = '';
            this.tableclass = 'table table-striped inputTable';
            this.controlgroupclass = 'control-group';
            this.controlclass = 'controls pull-right';
            this.labelclass = 'control-label';
            this.showtypes = 'true';
            this.removeicon = 'icon-remove';
            this.editicon = 'icon-edit';
            this.addicon = 'icon-plus';
            this.removetext = 'Remove';
            this.edittext = 'Edit';
            this.addtext = 'Add';
            this.onadd = 'onadd';
            this.onedit = 'onedit';
            this.onremove = 'onRemove';
            this.primaryKeyProperty = undefined;
        }
        // TODO - add toggles to turn off add or edit buttons
        InputTableConfig.prototype.getTableConfig = function () {
            return this.tableConfig || "tableConfig";
        };
        return InputTableConfig;
    })();
    Forms.InputTableConfig = InputTableConfig;
    var InputTable = (function () {
        function InputTable($compile) {
            var _this = this;
            this.$compile = $compile;
            this.restrict = 'A';
            this.scope = true;
            this.replace = true;
            this.transclude = true;
            this.attributeName = 'hawtioInputTable';
            // necessary to ensure 'this' is this object <sigh>
            this.link = function (scope, element, attrs) {
                return _this.doLink(scope, element, attrs);
            };
        }
        InputTable.prototype.doLink = function (scope, element, attrs) {
            var _this = this;
            var config = new InputTableConfig;
            var configName = attrs[this.attributeName];
            var tableConfig = Core.pathGet(scope, configName);
            config = Forms.configure(config, tableConfig, attrs);
            var entityName = attrs["entity"] || config.data || "entity";
            var propertyName = attrs["property"] || "arrayData";
            var entityPath = entityName + "." + propertyName;
            var primaryKeyProperty = config.primaryKeyProperty;
            // TODO better name?
            var tableName = config["title"] || entityName;
            if (angular.isDefined(config.json)) {
                config.data = $.parseJSON(config.json);
            }
            else {
                config.data = scope[config.data];
            }
            var div = $("<div></div>");
            // TODO lets ensure we have some default columns in the column configuration?
            var tableConfig = Core.pathGet(scope, configName);
            if (!tableConfig) {
                console.log("No table configuration for table " + tableName);
            }
            else {
                // TOCHECK: it seems that we can't do tableConfig['selectedItems'] = scope.selectedItems = []
                // and operate on scope.selectedItems here...
                // the nested simple-data-table operates on different selectedItems then...
                tableConfig["selectedItems"] = [];
                scope.config = tableConfig;
            }
            var table = this.createTable(config, configName);
            var group = this.getControlGroup(config, {}, "");
            var controlDiv = this.getControlDiv(config);
            controlDiv.addClass('btn-group');
            group.append(controlDiv);
            function updateData(action) {
                var data = Core.pathGet(scope, entityPath);
                // lets coerce the data to an array if its empty or an object
                if (!data) {
                    data = [];
                }
                if (!angular.isArray(data) && data) {
                    data = [data];
                }
                data = action(data);
                Core.pathSet(scope, entityPath, data);
                // TODO for some reason this doesn't notify the underlying hawtio-datatable that the table has changed
                // so lets force it with a notify...
                scope.$emit("hawtio.datatable." + entityPath, data);
                Core.$apply(scope);
            }
            function removeSelected(data) {
                angular.forEach(scope.config.selectedItems, function (selected) {
                    var id = selected["_id"];
                    if (angular.isArray(data)) {
                        data = data.remove(function (value) { return _.isEqual(value, selected); });
                        delete selected["_id"];
                        data = data.remove(function (value) { return _.isEqual(value, selected); });
                    }
                    else {
                        delete selected["_id"];
                        if (id) {
                            delete data[id];
                        }
                        else {
                            // lets iterate for the value
                            var found = false;
                            angular.forEach(data, function (value, key) {
                                if (!found && (_.isEqual(value, selected))) {
                                    console.log("Found row to delete! " + key);
                                    delete data[key];
                                    found = true;
                                }
                            });
                            if (!found) {
                                console.log("Could not find " + JSON.stringify(selected) + " in " + JSON.stringify(data));
                            }
                        }
                    }
                });
                return data;
            }
            var add = null;
            var edit = null;
            var remove = null;
            var addDialog = null;
            var editDialog = null;
            var readOnly = attrs["readonly"];
            if (!readOnly) {
                var property = null;
                var dataName = attrs["data"];
                var dataModel = dataName ? Core.pathGet(scope, dataName) : null;
                var schemaName = attrs["schema"] || dataName;
                var schema = schemaName ? Core.pathGet(scope, schemaName) : null;
                if (propertyName && dataModel) {
                    property = Core.pathGet(dataModel, ["properties", propertyName]);
                }
                add = this.getAddButton(config);
                scope.addDialogOptions = {
                    backdropFade: true,
                    dialogFade: true
                };
                scope.showAddDialog = false;
                scope.openAddDialog = function () {
                    // lets lazily create the add dialog
                    scope.addEntity = {};
                    scope.addFormConfig = Forms.findArrayItemsSchema(property, schema);
                    var childDataModelName = "addFormConfig";
                    if (!addDialog) {
                        var title = "Add " + tableName;
                        addDialog = $('<div modal="showAddDialog" close="closeAddDialog()" options="addDialogOptions">\n' + '<div class="modal-header"><h4>' + title + '</h4></div>\n' + '<div class="modal-body"><div simple-form="addFormConfig" entity="addEntity" data="' + childDataModelName + '" schema="' + schemaName + '"></div></div>\n' + '<div class="modal-footer">' + '<button class="btn btn-primary add" type="button" ng-click="addAndCloseDialog()">Add</button>' + '<button class="btn btn-warning cancel" type="button" ng-click="closeAddDialog()">Cancel</button>' + '</div></div>');
                        div.append(addDialog);
                        _this.$compile(addDialog)(scope);
                    }
                    scope.showAddDialog = true;
                    Core.$apply(scope);
                };
                scope.closeAddDialog = function () {
                    scope.showAddDialog = false;
                    scope.addEntity = {};
                };
                scope.addAndCloseDialog = function () {
                    var newData = scope.addEntity;
                    Forms.log.info("About to add the new entity " + JSON.stringify(newData));
                    if (newData) {
                        updateData(function (data) {
                            // TODO deal with non arrays
                            // find by primary key
                            // TODO something better than replace by primary key
                            if (primaryKeyProperty) {
                                data.remove(function (entity) { return entity[primaryKeyProperty] === newData[primaryKeyProperty]; });
                            }
                            data.push(newData);
                            return data;
                        });
                    }
                    scope.closeAddDialog();
                };
                edit = this.getEditButton(config);
                scope.editDialogOptions = {
                    backdropFade: true,
                    dialogFade: true
                };
                scope.showEditDialog = false;
                scope.openEditDialog = function () {
                    var selected = scope.config.selectedItems;
                    // lets make a deep copy for the value being edited
                    var editObject = {};
                    if (selected && selected.length) {
                        angular.copy(selected[0], editObject);
                    }
                    scope.editEntity = editObject;
                    scope.editFormConfig = Forms.findArrayItemsSchema(property, schema);
                    // lets lazily create the edit dialog
                    if (!editDialog) {
                        var title = "Edit " + tableName;
                        editDialog = $('<div modal="showEditDialog" close="closeEditDialog()" options="editDialogOptions">\n' + '<div class="modal-header"><h4>' + title + '</h4></div>\n' + '<div class="modal-body"><div simple-form="editFormConfig" entity="editEntity"></div></div>\n' + '<div class="modal-footer">' + '<button class="btn btn-primary save" type="button" ng-click="editAndCloseDialog()">Save</button>' + '<button class="btn btn-warning cancel" type="button" ng-click="closeEditDialog()">Cancel</button>' + '</div></div>');
                        div.append(editDialog);
                        _this.$compile(editDialog)(scope);
                    }
                    scope.showEditDialog = true;
                    Core.$apply(scope);
                };
                scope.closeEditDialog = function () {
                    scope.showEditDialog = false;
                    scope.editEntity = {};
                };
                scope.editAndCloseDialog = function () {
                    var newData = scope.editEntity;
                    console.log("About to edit the new entity " + JSON.stringify(newData));
                    if (newData) {
                        updateData(function (data) {
                            data = removeSelected(data);
                            // TODO deal with non arrays
                            data.push(newData);
                            return data;
                        });
                    }
                    scope.closeEditDialog();
                };
                remove = this.getRemoveButton(config);
            }
            var findFunction = function (scope, func) {
                if (angular.isDefined(scope[func]) && angular.isFunction(scope[func])) {
                    return scope;
                }
                if (angular.isDefined(scope.$parent) && scope.$parent !== null) {
                    return findFunction(scope.$parent, func);
                }
                else {
                    return null;
                }
            };
            function maybeGet(scope, func) {
                if (scope !== null) {
                    return scope[func];
                }
                return null;
            }
            var onRemoveFunc = config.onremove.replace('(', '').replace(')', '');
            var onEditFunc = config.onedit.replace('(', '').replace(')', '');
            var onAddFunc = config.onadd.replace('(', '').replace(')', '');
            var onRemove = maybeGet(findFunction(scope, onRemoveFunc), onRemoveFunc);
            var onEdit = maybeGet(findFunction(scope, onEditFunc), onEditFunc);
            var onAdd = maybeGet(findFunction(scope, onAddFunc), onAddFunc);
            if (onRemove === null) {
                onRemove = function () {
                    updateData(function (data) {
                        return removeSelected(data);
                    });
                };
            }
            if (onEdit === null) {
                onEdit = function () {
                    scope.openEditDialog();
                };
            }
            if (onAdd === null) {
                onAdd = function (form) {
                    scope.openAddDialog();
                };
            }
            if (add) {
                add.click(function (event) {
                    onAdd();
                    return false;
                });
                controlDiv.append(add);
            }
            if (edit) {
                edit.click(function (event) {
                    onEdit();
                    return false;
                });
                controlDiv.append(edit);
            }
            if (remove) {
                remove.click(function (event) {
                    onRemove();
                    return false;
                });
                controlDiv.append(remove);
            }
            $(div).append(group);
            $(div).append(table);
            $(element).append(div);
            // compile the template
            this.$compile(div)(scope);
        };
        InputTable.prototype.getAddButton = function (config) {
            return $('<button type="button" class="btn add"><i class="' + config.addicon + '"></i> ' + config.addtext + '</button>');
        };
        InputTable.prototype.getEditButton = function (config) {
            return $('<button type="button" class="btn edit" ng-disabled="!config.selectedItems.length"><i class="' + config.editicon + '"></i> ' + config.edittext + '</button>');
        };
        InputTable.prototype.getRemoveButton = function (config) {
            return $('<button type="remove" class="btn remove" ng-disabled="!config.selectedItems.length"><i class="' + config.removeicon + '"></i> ' + config.removetext + '</button>');
        };
        InputTable.prototype.createTable = function (config, tableConfig) {
            //var tableType = "hawtio-datatable";
            var tableType = "hawtio-simple-table";
            var table = $('<table class="' + config.tableclass + '" ' + tableType + '="' + tableConfig + '"></table>');
            //table.find('fieldset').append(this.getLegend(config));
            return table;
        };
        InputTable.prototype.getLegend = function (config) {
            var description = Core.pathGet(config, "data.description");
            if (description) {
                return '<legend>' + config.data.description + '</legend>';
            }
            return '';
        };
        InputTable.prototype.getControlGroup = function (config, arg, id) {
            var rc = $('<div class="' + config.controlgroupclass + '"></div>');
            if (angular.isDefined(arg.description)) {
                rc.attr('title', arg.description);
            }
            return rc;
        };
        InputTable.prototype.getControlDiv = function (config) {
            return $('<div class="' + config.controlclass + '"></div>');
        };
        InputTable.prototype.getHelpSpan = function (config, arg, id) {
            var rc = $('<span class="help-block"></span>');
            if (angular.isDefined(arg.type) && config.showtypes !== 'false') {
                rc.append('Type: ' + arg.type);
            }
            return rc;
        };
        return InputTable;
    })();
    Forms.InputTable = InputTable;
})(Forms || (Forms = {}));

var Forms;
(function (Forms) {
    var SubmitForm = (function () {
        function SubmitForm() {
            var _this = this;
            this.restrict = 'A';
            this.scope = true;
            // necessary to ensure 'this' is this object <sigh>
            this.link = function (scope, element, attrs) {
                return _this.doLink(scope, element, attrs);
            };
        }
        SubmitForm.prototype.doLink = function (scope, element, attrs) {
            var el = $(element);
            var target = 'form[name=' + attrs['hawtioSubmit'] + ']';
            el.click(function () {
                $(target).submit();
                return false;
            });
        };
        return SubmitForm;
    })();
    Forms.SubmitForm = SubmitForm;
})(Forms || (Forms = {}));

var Forms;
(function (Forms) {
    var ResetForm = (function () {
        function ResetForm() {
            var _this = this;
            this.restrict = 'A';
            this.scope = true;
            // necessary to ensure 'this' is this object <sigh>
            this.link = function (scope, element, attrs) {
                return _this.doLink(scope, element, attrs);
            };
        }
        ResetForm.prototype.doLink = function (scope, element, attrs) {
            var el = $(element);
            var target = 'form[name=' + attrs['hawtioReset'] + ']';
            el.click(function () {
                var forms = $(target);
                for (var i = 0; i < forms.length; i++) {
                    forms[i].reset();
                }
                return false;
            });
        };
        return ResetForm;
    })();
    Forms.ResetForm = ResetForm;
})(Forms || (Forms = {}));

/// <reference path="formHelpers.ts"/>
/// <reference path="simpleFormDirective.ts"/>
/// <reference path="inputTableDirective.ts"/>
/// <reference path="baseDirectives.ts"/>
/// <reference path="submitDirective.ts"/>
/// <reference path="resetDirective.ts"/>
/// <reference path="formGlobals.ts"/>
var Forms;
(function (Forms) {
    Forms._module = angular.module(Forms.pluginName, []);
    Forms._module.directive('simpleForm', ["$compile", function ($compile) {
        return new Forms.SimpleForm($compile);
    }]);
    // an alias of the above so we can support older views still
    Forms._module.directive('hawtioForm', ["$compile", function ($compile) {
        return new Forms.SimpleForm($compile);
    }]);
    Forms._module.directive('hawtioInputTable', ["$compile", function ($compile) {
        return new Forms.InputTable($compile);
    }]);
    Forms._module.directive('hawtioFormText', ["$compile", function ($compile) {
        return new Forms.TextInput($compile);
    }]);
    Forms._module.directive('hawtioFormPassword', ["$compile", function ($compile) {
        return new Forms.PasswordInput($compile);
    }]);
    Forms._module.directive('hawtioFormHidden', ["$compile", function ($compile) {
        return new Forms.HiddenText($compile);
    }]);
    Forms._module.directive('hawtioFormNumber', ["$compile", function ($compile) {
        return new Forms.NumberInput($compile);
    }]);
    Forms._module.directive('hawtioFormSelect', ["$compile", function ($compile) {
        return new Forms.SelectInput($compile);
    }]);
    Forms._module.directive('hawtioFormArray', ["$compile", function ($compile) {
        return new Forms.ArrayInput($compile);
    }]);
    Forms._module.directive('hawtioFormStringArray', ["$compile", function ($compile) {
        return new Forms.StringArrayInput($compile);
    }]);
    Forms._module.directive('hawtioFormCheckbox', ["$compile", function ($compile) {
        return new Forms.BooleanInput($compile);
    }]);
    Forms._module.directive('hawtioFormCustom', ["$compile", function ($compile) {
        return new Forms.CustomInput($compile);
    }]);
    Forms._module.directive('hawtioSubmit', function () {
        return new Forms.SubmitForm();
    });
    Forms._module.directive('hawtioReset', function () {
        return new Forms.ResetForm();
    });
    Forms._module.run(function () {
        Forms.log.debug("loaded");
    });
    /*
    _module.run(["helpRegistry", (helpRegistry) => {
      helpRegistry.addDevDoc("forms", 'app/forms/doc/developer.md');
    }]);
    */
    hawtioPluginLoader.addModule(Forms.pluginName);
})(Forms || (Forms = {}));

/// <reference path="../../includes.ts"/>
var Forms;
(function (Forms) {
    /**
     * Factory method to create a FormElement object
     * @returns {FormElement}
     */
    function createFormElement() {
        return {
            type: undefined
        };
    }
    Forms.createFormElement = createFormElement;
    /**
     * Factory method to create a FormTabs object
     * @returns {FormTabs}
     */
    function createFormTabs() {
        return {};
    }
    Forms.createFormTabs = createFormTabs;
    /**
     * Factory method to create a FormConfiguration object
     * @returns {FormConfiguration}
     */
    function createFormConfiguration() {
        return {
            properties: {}
        };
    }
    Forms.createFormConfiguration = createFormConfiguration;
    function createFormGridConfiguration() {
        return {
            rowSchema: {},
            rows: []
        };
    }
    Forms.createFormGridConfiguration = createFormGridConfiguration;
})(Forms || (Forms = {}));

/// <reference path="formPlugin.ts"/>
/// <reference path="formInterfaces.ts"/>
var Forms;
(function (Forms) {
    var formGrid = Forms._module.directive("hawtioFormGrid", ['$templateCache', '$interpolate', '$compile', function ($templateCache, $interpolate, $compile) {
        return {
            restrict: 'A',
            replace: true,
            scope: {
                configuration: '=hawtioFormGrid'
            },
            templateUrl: Forms.templateUrl + 'formGrid.html',
            link: function (scope, element, attrs) {
                function createColumns() {
                    return [];
                }
                function createColumnSequence() {
                    var columns = createColumns();
                    if (angular.isDefined(scope.configuration.rowSchema.columnOrder)) {
                        var order = scope.configuration.rowSchema.columnOrder;
                        order.forEach(function (column) {
                            var property = Core.pathGet(scope.configuration.rowSchema.properties, [column]);
                            Core.pathSet(property, ['key'], column);
                            columns.push(property);
                        });
                    }
                    angular.forEach(scope.configuration.rowSchema.properties, function (property, key) {
                        if (!columns.some(function (c) {
                            return c.key === key;
                        })) {
                            property.key = key;
                            columns.push(property);
                        }
                    });
                    //log.debug("Created columns: ", columns);
                    return columns;
                }
                function newHeaderRow() {
                    var header = element.find('thead');
                    header.empty();
                    return header.append($templateCache.get('rowTemplate.html')).find('tr');
                }
                function buildTableHeader(columns) {
                    var headerRow = newHeaderRow();
                    // Build the table header
                    columns.forEach(function (property) {
                        //log.debug("Adding heading for : ", property);
                        var headingName = property.label || property.key;
                        if (!scope.configuration.rowSchema.disableHumanizeLabel) {
                            headingName = headingName.titleize();
                        }
                        var headerTemplate = property.headerTemplate || $templateCache.get('headerCellTemplate.html');
                        var interpolateFunc = $interpolate(headerTemplate);
                        headerRow.append(interpolateFunc({ label: headingName }));
                    });
                    headerRow.append($templateCache.get("emptyHeaderCellTemplate.html"));
                }
                function clearBody() {
                    var body = element.find('tbody');
                    body.empty();
                    return body;
                }
                function newBodyRow() {
                    return angular.element($templateCache.get('rowTemplate.html'));
                }
                function buildTableBody(columns, parent) {
                    var rows = scope.configuration.rows;
                    rows.forEach(function (row, index) {
                        var tr = newBodyRow();
                        columns.forEach(function (property) {
                            var type = Forms.mapType(property.type);
                            if (type === "number" && "input-attributes" in property) {
                                var template = property.template || $templateCache.get('cellNumberTemplate.html');
                                var interpolateFunc = $interpolate(template);
                                var conf = {
                                    row: 'configuration.rows[' + index + ']',
                                    type: type,
                                    key: property.key,
                                    min: Core.pathGet(property, ['input-attributes', 'min']),
                                    max: Core.pathGet(property, ['input-attributes', 'max'])
                                };
                                tr.append(interpolateFunc(conf));
                            }
                            else {
                                var template = property.template || $templateCache.get('cellTemplate.html');
                                var interpolateFunc = $interpolate(template);
                                tr.append(interpolateFunc({
                                    row: 'configuration.rows[' + index + ']',
                                    type: type,
                                    key: property.key
                                }));
                            }
                        });
                        var func = $interpolate($templateCache.get("deleteRowTemplate.html"));
                        tr.append(func({
                            index: index
                        }));
                        parent.append(tr);
                    });
                }
                scope.removeThing = function (index) {
                    scope.configuration.rows.removeAt(index);
                };
                scope.addThing = function () {
                    scope.configuration.rows.push(scope.configuration.onAdd());
                };
                scope.getHeading = function () {
                    if (Core.isBlank(scope.configuration.rowName)) {
                        return 'items'.titleize();
                    }
                    return scope.configuration.rowName.pluralize().titleize();
                };
                scope.$watch('configuration.noDataTemplate', function (newValue, oldValue) {
                    var noDataTemplate = scope.configuration.noDataTemplate || $templateCache.get('heroUnitTemplate.html');
                    element.find('.nodata').html($compile(noDataTemplate)(scope));
                });
                scope.$watch('configuration.rowSchema', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var columns = createColumnSequence();
                        buildTableHeader(columns);
                    }
                }, true);
                scope.$watchCollection('configuration.rows', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var body = clearBody();
                        var columns = createColumnSequence();
                        // append all the rows to a temporary element so we can $compile in one go
                        var tmp = angular.element('<div></div>');
                        buildTableBody(columns, tmp);
                        body.append($compile(tmp.children())(scope));
                    }
                });
            }
        };
    }]);
})(Forms || (Forms = {}));

/// <reference path="formHelpers.ts"/>
/// <reference path="mappingRegistry.ts"/>
/// <reference path="formPlugin.ts"/>
var Forms;
(function (Forms) {
    var mapDirective = Forms._module.directive("hawtioFormMap", [function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: UrlHelpers.join(Forms.templateUrl, "formMapDirective.html"),
            scope: {
                description: '@',
                entity: '=',
                mode: '=',
                data: '=',
                name: '@'
            },
            link: function (scope, element, attr) {
                scope.deleteKey = function (key) {
                    try {
                        delete scope.entity[scope.name]["" + key];
                    }
                    catch (e) {
                        Forms.log.debug("failed to delete key: ", key, " from entity: ", scope.entity);
                    }
                };
                scope.addItem = function (newItem) {
                    if (!scope.entity) {
                        scope.entity = {};
                    }
                    Core.pathSet(scope.entity, [scope.name, newItem.key], newItem.value);
                    scope.showForm = false;
                };
                scope.$watch('showForm', function (newValue) {
                    if (newValue) {
                        scope.newItem = {
                            key: undefined,
                            value: undefined
                        };
                    }
                    // TODO actually look at the item type schema and use that for the 'value' parameter
                });
            }
        };
    }]);
})(Forms || (Forms = {}));

/// <reference path="../../includes.ts"/>
var HawtioForms;
(function (HawtioForms) {
    /**
     * Enum for form mode attribute
     */
    (function (FormMode) {
        FormMode[FormMode["VIEW"] = 0] = "VIEW";
        FormMode[FormMode["EDIT"] = 1] = "EDIT";
    })(HawtioForms.FormMode || (HawtioForms.FormMode = {}));
    var FormMode = HawtioForms.FormMode;
    /**
     * Enum for the overall form style
     */
    (function (FormStyle) {
        FormStyle[FormStyle["STANDARD"] = 0] = "STANDARD";
        FormStyle[FormStyle["INLINE"] = 1] = "INLINE";
        FormStyle[FormStyle["HORIZONTAL"] = 2] = "HORIZONTAL";
    })(HawtioForms.FormStyle || (HawtioForms.FormStyle = {}));
    var FormStyle = HawtioForms.FormStyle;
    function createFormConfiguration(options) {
        var answer = options || { properties: {} };
        _.defaults(answer, {
            style: 2 /* HORIZONTAL */,
            mode: 1 /* EDIT */
        });
        return answer;
    }
    HawtioForms.createFormConfiguration = createFormConfiguration;
})(HawtioForms || (HawtioForms = {}));

/// <reference path="../../includes.ts"/>
/// <reference path="forms2Interfaces.ts"/>
var HawtioForms;
(function (HawtioForms) {
    HawtioForms.pluginName = 'hawtio-forms2';
    HawtioForms.templatePath = 'plugins/forms2/html';
    HawtioForms.log = Logger.get(HawtioForms.pluginName);
})(HawtioForms || (HawtioForms = {}));

/// <reference path="forms2Helpers.ts"/>
var HawtioForms;
(function (HawtioForms) {
    HawtioForms._module = angular.module(HawtioForms.pluginName, []);
    HawtioForms._module.run(function () {
        HawtioForms.log.debug("loaded");
    });
    hawtioPluginLoader.addModule(HawtioForms.pluginName);
})(HawtioForms || (HawtioForms = {}));

/// <reference path="forms2Plugin.ts"/>
var HawtioForms;
(function (HawtioForms) {
    var directiveName = 'hawtioForm2';
    HawtioForms._module.directive(directiveName, ['$compile', '$templateCache', '$interpolate', 'SchemaRegistry', 'ControlMappingRegistry', function ($compile, $templateCache, $interpolate, schemas, mappings) {
        var postInterpolateActions = {};
        function addPostInterpolateAction(name, func) {
            if (!(name in postInterpolateActions)) {
                postInterpolateActions[name] = [];
            }
            postInterpolateActions[name].push(func);
        }
        function getFormMain(config) {
            switch (config.style) {
                case 0 /* STANDARD */:
                    return $templateCache.get('form-standard.html');
                case 1 /* INLINE */:
                    return $templateCache.get('form-inline.html');
                default:
                    return $templateCache.get('form-horizontal.html');
            }
        }
        function getStandardTemplate(config, control, type) {
            var template = undefined;
            switch (config.style) {
                case 2 /* HORIZONTAL */:
                    template = $templateCache.get('standard-horizontal-input.html');
                    break;
                default:
                    template = $templateCache.get('standard-input.html');
            }
            return applyElementConfig(config, control, template, type);
        }
        function applyElementConfig(config, control, template, type) {
            var el = angular.element(template);
            if ('tooltip' in control) {
                el.attr({ title: control.tooltip });
            }
            if ('control-group-attributes' in control) {
                el.attr(control['control-group-attributes']);
            }
            if ('label-attributes' in control) {
                el.find('label').attr(control['label-attributes']);
            }
            var input = el.find('input');
            if (type) {
                input.attr({ type: type });
            }
            if ('input-attributes' in control) {
                input.attr(control['input-attributes']);
            }
            return el.prop('outerHTML');
        }
        function getStaticTextTemplate(config) {
            switch (config.style) {
                case 2 /* HORIZONTAL */:
                    return $templateCache.get('static-horizontal-text.html');
                default:
                    return $templateCache.get('static-text.html');
            }
        }
        function getSelectTemplate(config, name, control) {
            var template = undefined;
            switch (config.style) {
                case 2 /* HORIZONTAL */:
                    template = $templateCache.get('select-horizontal.html');
                    break;
                default:
                    template = $templateCache.get('select.html');
            }
            addPostInterpolateAction(name, function (el) {
                var select = el.find('select');
                var propName = 'config.properties[\'' + name + '\'].enum';
                if (_.isArray(control.enum)) {
                    select.attr({ 'ng-options': 'label for label in ' + propName });
                }
                else {
                    select.attr({ 'ng-options': 'label for (label, value) in ' + propName });
                }
            });
            return applyElementConfig(config, control, template);
        }
        function getCheckboxTemplate(config, control) {
            switch (config.style) {
                case 2 /* HORIZONTAL */:
                    return $templateCache.get('checkbox-horizontal.html');
                default:
                    return $templateCache.get('checkbox.html');
            }
        }
        function getObjectTemplate(config, name, control) {
            addPostInterpolateAction(name, function (el) {
                el.find('.inline-object').attr({
                    'hawtio-form-2': 'config.properties.' + name,
                    'entity': 'entity.' + name
                });
            });
            return $templateCache.get('object.html');
        }
        function lookupTemplate(config, name, control) {
            var controlType = mappings.getMapping(control.type);
            if ('enum' in control) {
                controlType = 'select';
            }
            if ('properties' in control) {
                controlType = 'object';
            }
            if (control.hidden) {
                controlType = 'hidden';
            }
            switch (controlType) {
                case 'number':
                    return getStandardTemplate(config, control, 'number');
                case 'password':
                    return getStandardTemplate(config, control, 'password');
                case 'text':
                    return getStandardTemplate(config, control, 'text');
                case 'static':
                    return getStaticTextTemplate(config);
                case 'object':
                    return getObjectTemplate(config, name, control);
                case 'hidden':
                    control.hidden = true;
                    return applyElementConfig(config, control, $templateCache.get('hidden.html'));
                case 'select':
                    return getSelectTemplate(config, name, control);
                case 'checkbox':
                    return getCheckboxTemplate(config, control);
                default:
                    return undefined;
            }
        }
        function getTemplate(config, name, control) {
            if ('formTemplate' in control) {
                return control.formTemplate;
            }
            return lookupTemplate(config, name, control);
        }
        return {
            restrict: 'A',
            replace: true,
            scope: {
                config: '=' + directiveName,
                entity: '=?'
            },
            templateUrl: UrlHelpers.join(HawtioForms.templatePath, 'forms2Directive.html'),
            link: function (scope, element, attrs) {
                function maybeHumanize(value) {
                    var config = scope.config;
                    if (config && !config.disableHumanizeLabel) {
                        return Core.humanizeValue(value);
                    }
                    else {
                        return value;
                    }
                }
                ;
                // set any missing defaults
                scope.config = HawtioForms.createFormConfiguration(scope.config);
                scope.$watch('config', _.debounce(function () {
                    if (!scope.entity) {
                        scope.entity = {};
                    }
                    var entity = scope.entity;
                    var config = scope.config;
                    HawtioForms.log.debug("Config: ", config);
                    HawtioForms.log.debug("Entity: ", entity);
                    postInterpolateActions = {};
                    element.empty();
                    var form = angular.element(getFormMain(config));
                    var parent = form.find('fieldset');
                    if ('properties' in config) {
                        _.forIn(config.properties, function (control, name) {
                            var value = Core.pathGet(control, ['input-attributes', 'value']);
                            if (value) {
                                entity[name] = value;
                            }
                            var _default = Core.pathGet(control, ['default']);
                            if (_default) {
                                entity[name] = _default;
                            }
                            // log.debug("control: ", control);
                            var template = getTemplate(config, name, control);
                            if (template) {
                                // log.debug("template: ", template);
                                var interpolateFunc = $interpolate(template);
                                template = interpolateFunc({
                                    maybeHumanize: maybeHumanize,
                                    control: control,
                                    name: name,
                                    model: "entity." + name + ""
                                });
                                // log.debug("postInterpolateActions: ", postInterpolateActions);
                                if (postInterpolateActions[name]) {
                                    var el = angular.element(template);
                                    postInterpolateActions[name].forEach(function (func) {
                                        func(el);
                                    });
                                    template = el.prop('outerHTML');
                                }
                                HawtioForms.log.debug("template: ", template);
                                parent.append(template);
                            }
                        });
                    }
                    var s = scope.$new();
                    s.entity = scope.entity;
                    s.config = scope.config;
                    /*
                    form.append('<pre>{{entity}}</pre>');
                    form.append('<pre>{{config}}</pre>');
                    */
                    element.append($compile(form)(scope));
                    Core.$apply(scope);
                }, 500), true);
            }
        };
    }]);
})(HawtioForms || (HawtioForms = {}));

/// <reference path="forms2Plugin.ts"/>
var HawtioForms;
(function (HawtioForms) {
    HawtioForms._module.factory("SchemaRegistry", function () {
        var schemaMap = {};
        return {
            addSchema: function (name, schema) {
                schemaMap[name] = schema;
            },
            getSchema: function (name) {
                return schemaMap[name];
            },
            cloneSchema: function (name) {
                return _.clone(schemaMap[name], true);
            },
            removeSchema: function (name) {
                var answer = undefined;
                if (name in schemaMap) {
                    answer = schemaMap[name];
                    delete schemaMap[name];
                }
                return answer;
            },
            iterate: function (iter) {
                _.forIn(schemaMap, iter);
            }
        };
    });
})(HawtioForms || (HawtioForms = {}));

/// <reference path="forms2Plugin.ts"/>
var HawtioForms;
(function (HawtioForms) {
    HawtioForms._module.factory('ControlMappingRegistry', [function () {
        var controlMap = {};
        var answer = {
            addMapping: function (name, controlType) {
                controlMap[name.toLowerCase()] = controlType;
            },
            getMapping: function (name) {
                return controlMap[name.toLowerCase()];
            },
            removeMapping: function (name) {
                var answer = undefined;
                if (name.toLowerCase() in controlMap) {
                    answer = controlMap[name.toLowerCase()];
                    delete controlMap[name.toLowerCase()];
                }
                return answer;
            },
            iterate: function (iter) {
                _.forIn(controlMap, iter);
            }
        };
        /* Set up some defaults */
        _.forEach(["int", "integer", "long", "short", "java.lang.integer", "java.lang.long", "float", "double", "java.lang.float", "java.lang.double"], function (name) { return answer.addMapping(name, 'number'); });
        _.forEach(["boolean", "bool", "java.lang.boolean"], function (name) { return answer.addMapping(name, 'checkbox'); });
        answer.addMapping('password', 'password');
        answer.addMapping('hidden', 'hidden');
        answer.addMapping('static', 'static');
        answer.addMapping('enum', 'select');
        answer.addMapping('choice', 'radio-group');
        answer.addMapping('multiple', 'multiple-select');
        _.forEach(["string", "text", "java.lang.string"], function (name) { return answer.addMapping(name, 'text'); });
        return answer;
    }]);
})(HawtioForms || (HawtioForms = {}));

angular.module("hawtio-forms-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/forms/html/formGrid.html","<div>\n\n  <script type=\"text/ng-template\" id=\"heroUnitTemplate.html\">\n    <div class=\"hero-unit\">\n      <h5>No Items Added</h5>\n      <p><a href=\"\" ng-click=\"addThing()\">Add an item</a> to the table</p>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"headerCellTemplate.html\">\n    <th>{{label}}</th>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"emptyHeaderCellTemplate.html\">\n    <th></th>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"deleteRowTemplate.html\">\n    <td ng-click=\"removeThing({{index}})\" class=\"align-center\">\n      <i class=\"icon-remove red mouse-pointer\"></i>\n    </td>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"cellTemplate.html\">\n    <td>\n      <editable-property ng-model=\"{{row}}\"\n                         type=\"{{type}}\"\n                         property=\"{{key}}\"></editable-property>\n    </td>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"cellNumberTemplate.html\">\n    <td>\n      <editable-property ng-model=\"{{row}}\"\n                         type=\"{{type}}\"\n                         property=\"{{key}}\" min=\"{{min}}\" max=\"{{max}}\"></editable-property>\n    </td>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"rowTemplate.html\">\n    <tr></tr>\n  </script>\n\n  <div ng-show=\"configuration.rows.length == 0\" class=\"row-fluid\">\n    <div class=\"span12 nodata\">\n    </div>\n  </div>\n  <div ng-hide=\"configuration.rows.length == 0\" class=\"row-fluid\">\n    <div class=\"span12\">\n      <h3 ng-show=\"configuration.heading\">{{getHeading()}}</h3>\n      <table class=\"table table-striped\">\n        <thead>\n        </thead>\n        <tbody>\n        </tbody>\n      </table>\n    </div>\n    <div ng-click=\"addThing()\" class=\"centered mouse-pointer\">\n      <i class=\"icon-plus green\"></i><span ng-show=\"configuration.rowName\"> Add {{configuration.rowName.titleize()}}</span>\n    </div>\n  </div>\n</div>\n");
$templateCache.put("plugins/forms/html/formMapDirective.html","<div class=\"control-group\">\n  <label class=\"control-label\" for=\"keyValueList\">{{data[name].label || name | humanize}}:</label>\n  <div class=\"controls\">\n    <ul id=\"keyValueList\" class=\"zebra-list\">\n      <li ng-repeat=\"(key, value) in entity[name]\">\n        <strong>Key:</strong>&nbsp;{{key}}&nbsp;<strong>Value:</strong>&nbsp;{{value}}\n        <i class=\"pull-right icon-remove red mouse-pointer\" ng-click=\"deleteKey(key)\"></i>\n      </li>\n      <li>\n        <button class=\"btn btn-success\"  ng-click=\"showForm = true\" ng-hide=\"showForm\"><i class=\"icon-plus\"></i></button>\n        <div class=\"well\" ng-show=\"showForm\">\n          <form class=\"form-horizontal\">\n            <fieldset>\n              <div class=\"control-group\">\n                <label class=\"control-label\" for=\"newItemKey\">Key:</label>\n                <div class=\"controls\">\n                  <input id=\"newItemKey\" type=\"text\" ng-model=\"newItem.key\">\n                </div>\n              </div>\n              <div class=\"control-group\">\n                <label class=\"control-label\" for=\"newItemKey\">Value:</label>\n                <div id=\"valueInput\" class=\"controls\">\n                  <input id=\"newItemValue\" type=\"text\" ng-model=\"newItem.value\">\n                </div>\n              </div>\n              <p>\n              <input type=\"submit\" class=\"btn btn-success pull-right\" ng-disabled=\"!newItem.key && !newItem.value\" ng-click=\"addItem(newItem)\" value=\"Add\">\n              <span class=\"pull-right\">&nbsp;</span>\n              <button class=\"btn pull-right\" ng-click=\"showForm = false\">Cancel</button>\n              </p>\n            </fieldset>\n          </form>\n        </div>\n      </li>\n    </ul>\n  </div>\n</div>\n");
$templateCache.put("plugins/forms2/html/forms2Directive.html","<div>\n  <script type=\"text/ng-template\" id=\"standard-input.html\">\n    <div class=\"form-group\">\n      <label class=\"control-label\">{{control.label || maybeHumanize(name)}}</label>\n      <input type=\"\" class=\"form-control\" placeholder=\"{{control.placeholder}}\" ng-model=\"{{model}}\">\n      <p class=\"help-block\">{{control.description}}</p>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"standard-horizontal-input.html\">\n    <div class=\"form-group\">\n      <label class=\"col-sm-2 control-label\">{{control.label || maybeHumanize(name)}}</label>\n      <div class=\"col-sm-10\">\n        <input type=\"\" class=\"form-control\" placeholder=\"{{control.placeholder}}\" ng-model=\"{{model}}\">\n        <p class=\"help-block\">{{control.description}}</p>\n      </div>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"hidden.html\">\n    <div class=\"form-group\" ng-hide=\"true\">\n      <input type=\"hidden\" ng-model=\"{{model}}\">\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"object.html\">\n    <div class=\"row\">\n      <div class=\"clearfix col-md-12\">\n        <div class=\"inline-object\"></div>\n      </div>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"select-horizontal.html\">\n    <div class=\"form-group\">\n      <label class=\"col-sm-2 control-label\">{{control.label || maybeHumanize(name)}}</label>\n      <div class=\"col-sm-10\">\n        <select class=\"form-control\" ng-model=\"{{model}}\"></select>\n        <p class=\"help-block\">{{control.description}}</p>\n      </div>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"select.html\">\n    <div class=\"form-group\">\n      <label class=\"control-label\">{{control.label || maybeHumanize(name)}}</label>\n      <select class=\"form-control\" ng-model=\"{{model}}\"></select>\n      <p class=\"help-block\">{{control.description}}</p>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"static-text.html\">\n    <div class=\"form-group\">\n      <label class=\"control-label\">{{control.label}}</label>\n      <p class=\"form-control-static\">{{control.description}}</p>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"static-horizontal-text.html\">\n    <div class=\"form-group\">\n      <label class=\"col-sm-2 control-label\">{{control.label}}</label>\n      <div class=\"col-sm-10\">\n        <p class=\"form-control-static\">{{control.description}}</p>\n      </div>\n    </div>\n  </script>\n\n\n  <script type=\"text/ng-template\" id=\"checkbox-horizontal.html\">\n    <div class=\"form-group\">\n      <div class=\"col-sm-offset-2 col-sm-10\">\n        <div class=\"checkbox\">\n          <label>\n            <input type=\"checkbox\" ng-model=\"{{model}}\"> {{control.label || maybeHumanize(name)}}\n          </label>\n          <p class=\"help-block\">{{control.description}}</p>\n        </div>\n      </div>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"checkbox.html\">\n    <div class=\"form-group\">\n      <div class=\"checkbox\">\n        <label>\n          <input type=\"checkbox\" ng-model=\"{{model}}\"> {{control.label || maybeHumanize(name)}}\n        </label>\n        <p class=\"help-block\">{{control.description}}</p>\n      </div>\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"radio-top-level.html\">\n    <div class=\"radio\">\n    </div>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"radio-group-member.html\">\n    <label>\n      <input type=\"radio\" name=\"\" value=\"\">\n    </label>\n  </script>\n\n  <script type=\"text/ng-template\" id=\"form-standard.html\">\n    <form>\n      <fieldset>\n        <legend ng-show=\"config.label || config.description\" ng-hide=\"config.hideLegend\">{{config.label || config.description}}</legend>\n      </fieldset>\n    </form>\n  </script>\n  <script type=\"text/ng-template\" id=\"form-inline.html\">\n    <form class=\"form-inline\">\n      <fieldset>\n        <legend ng-show=\"config.label || config.description\" ng-hide=\"config.hideLegend\">{{config.label || config.description}}</legend>\n      </fieldset>\n    </form>\n  </script>\n  <script type=\"text/ng-template\" id=\"form-horizontal.html\">\n    <form class=\"form-horizontal\">\n      <fieldset>\n        <legend ng-show=\"config.label || config.description\" ng-hide=\"config.hideLegend\">{{config.label || config.description}}</legend>\n      </fieldset>\n    </form>\n  </script>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-forms-templates");
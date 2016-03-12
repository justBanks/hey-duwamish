/*globals _ Spinner Handlebars Backbone jQuery Gatekeeper */

var Shareabouts = Shareabouts || {};

(function(S, $, console){
  S.DatasetFormView = Backbone.View.extend({
    // View responsible for the form for adding and editing places.
    events: {
      'submit form': 'onSubmit',
      'change input[type="file"]': 'onInputFileChange',
      'click .category-btn-label-clickable': 'onCategoryChange',
      'click .category-menu-hamburger': 'onExpandCategories'
    },
    initialize: function(){
      // TODO: configure this
      S.TemplateHelpers.overridePlaceTypeConfig(this.options.placeConfig.items,
        this.options.defaultPlaceTypeName);
      S.TemplateHelpers.insertInputTypeFlags(this.options.placeConfig.items);
    },
    render: function(category, category_selected){
      // Augment the model data with place types for the drop down
      //
      //  This is a little hacky--I need to find a better way to extend the template helpers
      //  One option is to stop relying on them entirely and just use registered Handlebar helper functions
      if (category != undefined) {
        S.TemplateHelpers.insertInputTypeFlags(this.options.placeConfig.categories[category].fields);
      }
      ///////////
      

      var data = _.extend({
        place_config: this.options.placeConfig,
        selected_category: this.options.placeConfig.categories[category],
        category_selected: category_selected || false,
        user_token: this.options.userToken,
        current_user: S.currentUser
      }, S.stickyFieldValues);

      this.$el.html(Handlebars.templates['dataset-form'](data));
      return this;
    },
    remove: function() {
      this.unbind();
    },
    onError: function(model, res) {
      // TODO handle model errors!
      console.log('oh no errors!!', model, res);
    },
    // This is called from the app view
    setLatLng: function(latLng) {
      this.center = latLng;
      this.$('.drag-marker-instructions, .drag-marker-warning').addClass('is-visuallyhidden');
    },
    setLocation: function(location) {
      this.location = location;
    },
    // Get the attributes from the form
    getAttrs: function() {
      var attrs = {},
          locationAttr = this.options.placeConfig.location_item_name,
          $form = this.$('form');

      if (this.location && locationAttr) {
        attrs[locationAttr] = this.location;
      }

      return attrs;
    },
    onCategoryChange: function(evt) {
      var animationDelay = 400;
      // re-render the form with the selected category
      this.render($(evt.target).parent().prev().attr("id"), true);
      // manually set the category button again since the re-render resets it
      $(evt.target).parent().prev().prop("checked", true);
      // hide and then show (with animation delay) the selected category button 
      // so we don't see a duplicate selected category button briefly
      $("#selected-category").hide().show(animationDelay);
      // slide up unused category buttons
      $("#category-btns").animate( { height: "hide" }, animationDelay );      
    },
    onExpandCategories: function(evt) {
      var animationDelay = 400;
      $("#selected-category").hide();
      $("#category-btns").animate( { height: "show" }, animationDelay ); 
    },
    onInputFileChange: function(evt) {

    }
  });
}(Shareabouts, jQuery, Shareabouts.Util.console));

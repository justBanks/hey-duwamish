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
    getAttrs: function() {
      var attrs = {},
          locationAttr = this.options.placeConfig.location_item_name,
          $form = this.$('form');

      // Get values from the form
      attrs = S.Util.getAttrs($form);

      // get associated display values (for use on the place detail view)
      // we get the display values off of the rendered form in case we're working with translated content
      attrs.display_labels = {};

      // get display value associated with <select> elements
      $form.find(":selected").each(function() {
        attrs.display_labels[$(this).parent().attr("name")] = ($(this).attr("value") == "no_response") ? "" : $(this).html();
      });
      
      // get display value associated with checkbox and radio elements
      $form.find(":checked").each(function() {
        attrs.display_labels[$(this).attr("name")] = $(this).siblings("label").html();
      });

      // handle special case of yes-only checkboxes
      $form.find("[data-type='yes_only_big_button']:not(:checked)").each(function() {
        attrs.display_labels[$(this).attr("name")] = $(this).attr("data-alt-value");
      });

      // handle text boxes
      $form.find("textarea, input[type='text']").each(function() {
        attrs.display_labels[$(this).attr("name")] = $(this).val();
      });

      // Get the location attributes from the map
      attrs.geometry = {
        type: 'Point',
        coordinates: [this.center.lng, this.center.lat]
      };

      if (this.location && locationAttr) {
        attrs[locationAttr] = this.location;
      }

      return attrs;
    },
    onCategoryChange: function(evt) {
      var self = this,
          animationDelay = 400,
          categoryId = $(evt.target).parent().prev().attr('id'),
          // get the dataset id from the config so we know which collection to add it to
          datasetId = this.options.placeConfig.categories[categoryId].dataset;

      // re-render the form with the selected category
      this.render(categoryId, true);
      // manually set the category button again since the re-render resets it
      $(evt.target).parent().prev().prop("checked", true);
      // hide and then show (with animation delay) the selected category button 
      // so we don't see a duplicate selected category button briefly
      $("#selected-category").hide().show(animationDelay);
      // slide up unused category buttons
      $("#category-btns").animate( { height: "hide" }, animationDelay );

      console.log("this.collection", this.collection);

      // instantiate appropriate backbone model
      this.collection[datasetId].on('add', self.setModel, this );
      this.collection[datasetId].add({});
    },
    setModel: function(model) {
      this.model = model;
    },
    onExpandCategories: function(evt) {
      var animationDelay = 400;
      $("#selected-category").hide(animationDelay);
      $("#category-btns").animate( { height: "show" }, animationDelay ); 
    },
    onInputFileChange: function(evt) {

    },
    onSubmit: Gatekeeper.onValidSubmit(function(evt) {
      // Make sure that the center point has been set after the form was
      // rendered. If not, this is a good indication that the user neglected
      // to move the map to set it in the correct location.
      if (!this.center) {
        this.$('.drag-marker-instructions').addClass('is-visuallyhidden');
        this.$('.drag-marker-warning').removeClass('is-visuallyhidden');

        // Scroll to the top of the panel if desktop
        this.$el.parent('article').scrollTop(0);
        // Scroll to the top of the window, if mobile
        window.scrollTo(0, 0);
        return;
      }

      var router = this.options.router,
          model = this.model,
          // Should not include any files
          attrs = this.getAttrs(),
          $button = this.$('[name="save-place-btn"]'),
          spinner, $fileInputs;

      model.attributes["from_dynamic_form"] = true;
      evt.preventDefault();

      $button.attr('disabled', 'disabled');
      spinner = new Spinner(S.smallSpinnerOptions).spin(this.$('.form-spinner')[0]);

      S.Util.log('USER', 'new-place', 'submit-place-btn-click');

      S.Util.setStickyFields(attrs, S.Config.survey.items, S.Config.place.items);

      // Save and redirect
      this.model.save(attrs, {
        success: function() {
          S.Util.log('USER', 'new-place', 'successfully-add-place');
          router.navigate('/'+ model.get('datasetSlug') + '/' + model.id, {trigger: true});
        },
        error: function() {
          S.Util.log('USER', 'new-place', 'fail-to-add-place');
        },
        complete: function() {
          $button.removeAttr('disabled');
          spinner.stop();
        },
        wait: true
      });
    })
  });
}(Shareabouts, jQuery, Shareabouts.Util.console));

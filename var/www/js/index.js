(function($, _, global, undefined) {
	'use strict';

	var Toodoo = {
		views: {},
		collections: {},
		models: {},

		setState: function(state) {
			var self = this;
			this.model = new Toodoo.models.list(state);

			$(document).ready(function() {
				self.view  = new Toodoo.views.app({ model: self.model });
			});
		}
	};

	Toodoo.models.list = Backbone.Model.extend({
		defaults: {
			title: '',
			uuid: '',
			list: undefined
		},
		url: '/list',
		initialize: function(state) {
			this.set('list', new Toodoo.collections.list(state.list));
		}
	});

	Toodoo.models.item = Backbone.Model.extend({
		defaults: {
			checked: false,
			title: ''
		}
	});

	Toodoo.collections.list = Backbone.Collection.extend({
		model: Toodoo.models.item
	});

	Toodoo.views.app = Backbone.View.extend({
		el: 'div#app',

		events: {
			'click #add':  'addListItem',
			'click #save': 'saveList'
		},

		render: function() {
			console.log(this.model.toJSON());
			console.log(this.$el);
		},

		initialize: function(opts) {
			this.$title = $(this.el).find('#title');
			this.$title.val(opts.model.get('title'));
			this.list = new Toodoo.views.list({ collection: opts.model.get('list')});
		},

		addListItem: function() {
			
		}
	});

	Toodoo.views.list = Backbone.View.extend({
		el: 'ul#items',
		items: [],

		initialize: function(opts) {
			var self = this
			opts.collection.each(function(item) {
				self.items.push(new Toodoo.views.item({ model: item }));
			});
		},
	});

	Toodoo.views.item = Backbone.View.extend({
		tagName: 'li',
		initialize: function(opts) {
			this.model = opts.model;
		},
		render: function() {
			var value = ['<input type="checkbox"', this.model.get('checked') ? 'checked="checked"' : '', '/>', 
			  '<input type="text" placeholder="List item"', this.model.get('title') ? 'value="' + this.model.get('title') + '"' : ''].join(' ');
			 console.log(value);
			//$(this.el).append('<input type="checkbox" checked="" )
		}
	});

	window.Toodoo = Toodoo;
})(Zepto, _, window);
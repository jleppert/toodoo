(function($, _, global, undefined) {
	'use strict';

	var Toodoo = {
		views: {},
		collections: {},
		models: {},

		setState: function(state, appInfo) {
			this.model = new Toodoo.models.list(state);
			console.log('setstate', state, appInfo);
			var self = this;
			$(document).ready(function() {
				self.view  = new Toodoo.views.app({ model: self.model, appInfo: appInfo });
				$('a').click(function(event) { event.preventDefault(); });
			});

			var router = Backbone.Router.extend({});
			this.router = new router();
			Backbone.history.start({ pushState: true });
		}
	};

	Toodoo.models.list = Backbone.Model.extend({
		idAttribute: 'uuid',
		urlRoot: '/list',
		initialize: function(state) {
			this.set('list', new Toodoo.collections.list(state.list));
		},
		parse: function(data) {
			return { uuid: data.uuid };
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
			'click #save': 'saveList',
			'change #title': 'updateTitle'
		},

		initialize: function(opts) {
			this.appInfo = opts.appInfo;
			this.$title = $(this.el).find('#title');
			this.$title_row = $(this.el).find('#title-row');
			this.$title.val(opts.model.get('title'));
			this.$list_title = $(this.el).find('#list-title');
			this.listView = new Toodoo.views.list({ collection: opts.model.get('list')});



			this.model.bind('sync', function(model) {
				var uuid = model.get('uuid');
				if(uuid != undefined) Toodoo.router.navigate('list/' + uuid, { replace: true });
			});

			var self = this;
			this.model.bind('change', function(model) {
				self.$list_title.html(model.get('title'));
				$(document).prop('title', self.appInfo.title + ': ' + model.get('title'));
				console.log('title changed!!');
				console.log(model.get('title'));
			});

		},

		updateTitle: function(event) {
			this.model.set('title', $(event.target).val());
		},

		addListItem: function() {
			this.listView.addListItem();
		},

		saveList: function() {
			var self = this;
			this.model.save(undefined, {
				success: function(model, response) {
					self.$title_row.remove();
					var view = new Toodoo.views.alert({ message: 'Your list was saved successfully', tpl: 'alert-success' });
					view.render(function($el) {
						self.$el.prepend($el);
						$el.addClass('fade-in');
						setTimeout(function() {
							$el.addClass('fade-out');
							setTimeout(function() {
								$el.remove();
							}, 500);
						}, 2000);
					});
				},
				error: function(model, response) {
					var view = new Toodoo.views.alert({ message: 'An error occured saving your list', tpl: 'alert-error' });
					view.render(function($el) {
						self.$el.prepend($el);
						$el.addClass('fade-in');
						setTimeout(function() {
							$el.addClass('fade-out');
							setTimeout(function() {
								$el.remove();
							}, 500);
						}, 2000);
					});
				}
			});
		}
	});

	Toodoo.views.list = Backbone.View.extend({
		el: 'ul#items',
		itemViews: [],

		initialize: function(opts) {
			var self = this,
				items = $('ul#items').find('li');
			this.collection = opts.collection;
			opts.collection.each(function(model, index) {
				self.itemViews.push(new Toodoo.views.item({ model: model, el: items[index]}));
			});
		},
		addListItem: function() {
			var model = new Toodoo.models.item();
			this.collection.add(model);
			var view = new Toodoo.views.item({ model: model });
			this.itemViews.push(view);
			var self = this;
			view.render(function(el) {
				$(self.el).append(el);;
			});
		}
	});

	Toodoo.views.item = Backbone.View.extend({
		tagName: 'li',
		events: {
			'change input[type="checkbox"]': 'checkItem',
			'change input[type="text"]': 'updateTitle'
		},

		checkItem: function(event) {
			if($(event.target).is(':checked')) {
				this.model.set('checked', true);
			} else {
				this.model.set('checked', false);
			}
			console.log('updated model!!', this.model);
		},

		updateTitle: function(event) {
			this.model.set('title', $(event.target).val());
		},

		initialize: function(opts) {
			this.model = opts.model;
			this.el    = opts.el;
		},
		render: function(cb) {
			var self = this;
			dust.render('item', this.model.toJSON(), function(err, output) {
				self.setElement(output);
				cb(self.$el);
			});
		}
	});

	Toodoo.views.alert = Backbone.View.extend({
		tagName: 'div',
		events: {

		},
		initialize: function(opts) {
			this.message = opts.message;
			this.tpl     = opts.tpl;
		},
		render: function(cb) {
			var self = this;
			dust.render(this.tpl, { message: this.message }, function(err, output) {
				self.setElement(output);
				cb(self.$el);
			});
		}
	});

	window.Toodoo = Toodoo;
})(Zepto, _, window);
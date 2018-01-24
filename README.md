# Easybars

> String templating made {{easy}}

Easybars offers templating similar to Handlebars or Mustache but with more focused features in an impressively small package. We take the best of what makes templates easy to use and drop the burdensome features that bloat or slow other scripts.

## Features

* **Small Size**
   * We want to be small enough to use in optimized web bundles without adding too much weight.
* **No Encoding by Default**
   * We find that in most use cases, users want to insert one HTML snippet into another. Inserting encoded text is simple to do, but it is only done on demand ([see below](#encode)).
* **Dot Notation in Variable Names**
   * This helps us organize data effectively at little cost to performance.
* **Escape Chars When Needed**
   * We provide an option to escape whatever characters give you trouble
* **Collapse Output Into One Line**
   * Easily transform a multi-line template file into a one line string.
* **High Performance**
   * We're way faster than Handlebars, and about even with Resig's Micro-Templating.
* **Simple Looping**
   * Because sometimes it helps to pre-compile certain template objects with iteration before render time. ([see below](#helpers))

## How to Install
```
npm i --save easybars
```

## How to Use

### The simple way
`easybars(template, data)`
```js
const easybars = require('easybars');
const output = easybars('Hello {{name}}!', { name: 'World' });

console.log(output); // Hello World!
```

### The more versatile way
`new Easybars()`
```js
const Easybars = require('easybars');

const easybars = new Easybars();
const template = easybars.compile('<div class="{{myClass}}">{{{myContent}}}</div>');
const output = template({
    myClass: 'foo',
    myContent: '&bar',
});

console.log(output); // <div class="foo">&amp;bar</div>
```

Inserted content is unmodified by default, but if you wish to encode for HTML, add an extra curly to your tags: `{{{encodeMe}}}`

---

## Options

`new Easybars(options)`

### tags

default is
```js
tags: {
    raw: ['{{','}}'],
    encoded: ['{{{','}}}'],
    section: ['{{#','{{/','}}'],
}
```

If you don't like curly braces, you can specify which tags to use for replacement. For example, some prefer
```js
tags: {
    raw: ['<%=','%>'],
    encoded: ['<%-','%>'],
    section: ['<%#','<%/','%>'],
}
```

### collapse

default is `false`

On occasion, the string returned by the template will need to be written into another file as a string or bundled. Set this option to `true` to collapse all line breaks and extra spaces in your final rendered output into one condensed line.

### encode

default is
```js
encode: {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
}
```
We find that the most common use case involves trying to insert one snippet of HTML into another and have them both render properly. As such, inserted values are NOT encoded by default. However, sometimes users want to insert text into an html document and they want to be sure not to break the rendering. Using our special "insert encoded" tag (triple curly brackets by default `{{{likeThis}}}`) will encode any characters that would absolutely break html rendering. When the "insert encoded" tag is used, this character map specifies which characters will be replaced. Passing an object map of characters here will override the default set of encodings with your own.

### escape

default is `[]`

Sometimes, inserted values could break your code or lead to security vulnerabilities if not properly escaped. Although none are escaped by default, any characters provided in this Array will be escaped before they are inserted into the template.

### removeUnmatched

default is `false`

It is not uncommon to nest templates within templates, and it is often useful to replace some vars in one step and leave some for another step. Our default behavior is to leave unmatched variables in the template so that they can be replaced at a later time. If you would prefer to hide unmatched variables, set this option to `true` to replace them with an empty string.

## An example using all options
```js
new Easybars({
    collapse: false,
    encode: {
        '<': '&lt;',
        '>': '&gt;',
        '=': '&#x3D;',
    },
    escape: ['"','8'],
    tags: {
        raw: ['<%=','%>'],
        encoded: ['<%-','%>'],
    }
});
```

---

## Helpers

### Each

The `#each` helper tag may be used to iterate over each item within a given data object and duplicate the contained template elements each time.

Using `#each` with an Object
```js
easybars('<ul>{{#each fruits}}<li>{{@key}} is {{@value}}</li>{{/each}}</ul>', { fruits: { apple: 'red', banana: 'yellow' } });
// <ul><li>apple is red</li><li>banana is yellow</li></ul>
```

Using `#each` with an Array
```js
easybars('<ul>{{#each fruits}}<li>{{@key}} is {{name}}</li>{{/each}}</ul>', { fruits: [{ name: 'apple' }, { name: 'banana' }] });
// <ul><li>0 is apple</li><li>1 is banana</li></ul>
```

### For

The `#for n` helper tag may be used to iterate `n` number of times and duplicate the contained template elements  `n` times.

Using `#for`
```js
easybars('<ul>{{#for 2 fruits}}<li>{{name}} is {{color}}</li>{{/for}}</ul>', { fruits: [{ name: 'apple', color: 'red' }, { name: 'banana', color: 'yellow' }, { name: 'kiwi', color: 'green' }] });
// <ul><li>apple is red</li><li>banana is yellow</li></ul>
```

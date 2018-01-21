# Easybars

> String templating made {{easy}}

Easybars offers templating similar to Handlebars or Mustache but with more focused features in an impressively small package. We're also lightning fast (even faster than Resig's Micro-Templating)

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

console.log(output);
// Hello World!
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

console.log(output);
// <div class="foo">&amp;bar</div>
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
}
```

If you don't like curly braces, you can specify which tags to use for replacement. For example, some prefer
```js
tags: {
    raw: ['<%=','%>'],
    encoded: ['<%-','%>'],
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
}
```
A very common use case for templating involves inserting text into an html document. Using our special "insert encoded" tag (triple curly brackets by default `{{{likeThis}}}`) will encode any characters that would absolutely break html rendering. When the "insert encoded" tag is used, the character map set here specifies which characters will be replaced. Passing an object map of characters here will override this set with your own.

### escape

default is `[]`

Sometimes, inserted values could break your code or lead to security vulnerabilities if not properly escaped. Although none are escaped by default, any characters provided in this Array will be escaped before they are inserted into the template.

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

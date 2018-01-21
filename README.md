# Easybars

> String templating made {{easy}}

Easybars offers templating similar to Handlebars or Mustache but with more focused features in an impressively small package. We're also lightning fast (even faster than Resig's Micro-Templating)

## How to Install
```
npm i --save easybars
```

## How to Use

### The simple way
```js
const easybars = require('easybars');
const output = easybars('Hello {{name}}!', { name: 'World' });
console.log(output);
// Hello World!
```

### The more versatile way
```js
const Easybars = require('easybars');

const easybars = new Easybars();
const template = easybars.compile('<div class="{{myClass}}">{{myContent}}</div>');
const output = template({
    myClass: 'foo',
    myContent: 'bar',
});

console.log(output);
// <div class="foo">bar</div>
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

### encode

default is
```js
encode: {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
}
```

Most characters in inserted values are not encoded by default. We generally aim to leave inserted strings unmodified, but since the most common use case involves inserting code into an html document, our default behavior is to encode the few characters that will absolutely break html rendering. Passing an Array of characters here will override this set with your own.

### escape

default is `[]`

Sometimes, inserted values could break your code if not properly escaped. Although none are escaped by default, any characters provided in this Array will be escaped before they are inserted into the template.

### collapse

default is `false`

On occasion, the string returned by the template will need to be written into another file as a string or bundled. Set this option to `true` to collapse all line breaks and extra spaces in your final rendered output into one condensed line.

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

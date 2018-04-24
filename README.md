## Project Boilerplate
One of the most frustrating aspects of modern web development is merely getting started. There are a lot of decisions that one must make before the project can even begin, and this issue is so prevalent it even has its own name (Javascript fatigue!). 

In this repo I'm aiming to create a bare-bones outline of how I start a project, and I will walk through the reasoning behind what everything is and why it is necessary.

**Technologies we will use:**

* Node.js: A Javascript runtime (a way to run JavaScript that isn’t limited to your browser).
* [NPM](https://www.npmjs.com/get-npm): Used to stand for node package manager but now it doesn’t stand for anything. It’s essentially like pip or condo for python. 
* [Babel](https://babeljs.io/): A Javascript compiler that transpiles modern JS to a browser compatible version. 
* [ESLint](https://eslint.org/): A linter to keep your code standardized. 
* [Webpack](https://webpack.js.org/): A code bundler. This allows you to create one bundled file from all your javascript and css files. Instead of having lots of `<script>` and `<link>` tags for all your javascript and css in your html file, webpack will do all the bundling for you.

**To start:**

1. Check if npm is installed by running `npm -v` in the command line. If it is not, you may have to install `node.js` and `npm` from [here](https://www.npmjs.com/get-npm).
2. Clone this repo.
3. `cd` into the main directory of the project and run `npm install`. This will install all the necessary dependencies for the project.
4. Run `npm run build:watch`. This will start up the development server and direct you to the correct port on your local machine.
5. There is a lot of stuff going on in this project that might seem confusing. For now, only focus on the `src` directory and the `index.html` file. You will write HTML in the `index.html` file, css in `src/index.css` and javascript in `src/index.js`.

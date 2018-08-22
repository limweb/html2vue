#! /usr/bin/env node

var fs = require("fs")
var path = require("path")
var meow = require("meow")
var chalk = require("chalk")
var glob = require("glob")
var extractReactComponents = require("./")

var cli = meow(
    `Usage
  $ html2react <input> [options]

Options

  -c, --component    Type of generated vue components                   ["vue","es6"]   [default: "vue"]
  -o, --out          Output directory path                                                              [default: "components"]
  -e, --ext          Output files extension                                                             [default: "vue"]
  -d, --delimiter    Delimiter character to be used in modules filename

More info at https://github.com/roman01la/html-to-react-components`, {
        alias: {
            h: "help",
            v: "version",
            c: "component",
            m: "module",
            d: "delimiter",
            o: "out",
            e: "ext"
        }
    }
)

var flags = cli.flags
glob(cli.input[0], function(err, files) {
    if (err) {
        return console.warn(chalk.red(err))
    }

    var stats = files
        .map(function(f) {
            var html = fs.readFileSync(path.join(process.cwd(), f), "utf8")
            return extractReactComponents(html, {
                componentType: flags.component || flags.c,
                moduleType: flags.module || flags.m,
                moduleFileNameDelimiter: processDelimiterOption(
                    flags.delimiter || flags.d
                ),
                output: {
                    path: flags.out || flags.o,
                    fileExtension: flags.ext || flags.e
                }
            })
        })
        .reduce(
            function(agg, cs) {
                var names = cs.map(c => c.cname);
                agg.count += names.length
                agg.names = agg.names.concat(names)
                return agg
            }, {
                count: 0,
                names: []
            }
        )

    // console.log(stats);
    console.log(
        chalk.green(
            `Successfully generated ${chalk.red.bold(
        stats.count
      )} components: ${chalk.red.bold(stats.names.join(", "))}`
        )
    )
})

function processDelimiterOption(flag) {
    return typeof flag === "string" && flag !== "" ? flag : ""
}
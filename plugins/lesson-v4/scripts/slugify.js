#!/usr/bin/env node
"use strict";

const { lessonSlug } = require("../shared/text/filename");

process.stdout.write(lessonSlug(process.argv.slice(2).join(" ")));

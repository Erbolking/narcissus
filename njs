#!/usr/bin/python
#
# Narcissus 'shell' for use with jstests.py
# Expects to be in the same directory as ./js
# Expects the Narcissus src files to be in ./narcissus/

import os, re, sys, signal
from subprocess import *
from optparse import OptionParser

THIS_DIR = os.path.dirname(__file__)
LIB_DIR = os.path.abspath(os.path.join(THIS_DIR, 'lib'))

if 'NJS_SHELL' in os.environ:
    js_cmd = os.path.abspath(os.environ['NJS_SHELL'])
else:
    js_cmd = os.path.abspath(os.path.join(THIS_DIR, 'js'))

narc_jsdefs = os.path.join(LIB_DIR, "jsdefs.js")
narc_jslex = os.path.join(LIB_DIR, "jslex.js")
narc_jsparse = os.path.join(LIB_DIR, "jsparse.js")
narc_jsssa = os.path.join(LIB_DIR, "jsssa.js")
narc_jsdecomp = os.path.join(LIB_DIR, "jsdecomp.js");
narc_jsexec = os.path.join(LIB_DIR, "jsexec.js")

def handler(signum, frame):
    print ''
    # the exit code produced by ./js on SIGINT
    sys.exit(130)

signal.signal(signal.SIGINT, handler)

if __name__ == '__main__':
    op = OptionParser(usage='%prog [TEST-SPECS]')
    op.add_option('-f', '--file', dest='js_files', action='append',
            help='JS file to load', metavar='FILE')
    op.add_option('-e', '--expression', dest='js_exps', action='append',
            help='JS expression to evaluate')
    op.add_option('-i', '--interactive', dest='js_interactive', action='store_true',
            help='enable interactive shell')
    op.add_option('-H', '--harmony', dest='js_harmony', action='store_true',
            help='enable ECMAScript Harmony mode')
    op.add_option('-S', '--ssa', dest='js_ssa', action='store_true',
            help='enable parse-time SSA construction')
    op.add_option('-P', '--parse-only', dest='js_parseonly', action='store_true',
            help='stop after the parsing stage and output pretty-printed source code')

    (options, args) = op.parse_args()

    cmd = ""

    if options.js_harmony:
        cmd += 'Narcissus.options.version = "harmony"; '

    if options.js_ssa:
        cmd += 'Narcissus.options.builderType = "ssa"; '

    if options.js_exps:
        for exp in options.js_exps:
            if options.js_parseonly:
                cmd += 'print(Narcissus.decompiler.pp(Narcissus.parser.parse(new Narcissus.definitions.Builder, "%s"))); ' % exp.replace('"', '\\"')
            else:
                cmd += 'Narcissus.interpreter.evaluate("%s"); ' % exp.replace('"', '\\"')

    if options.js_files:
        for file in options.js_files:
            if options.js_parseonly:
                cmd += 'print(Narcissus.decompiler.pp(Narcissus.parser.parse(new Narcissus.definitions.Builder, snarf("%(file)s"), "%(file)s", 1))); ' % { 'file':file }
            else:
                cmd += 'Narcissus.interpreter.evaluate(snarf("%(file)s"), "%(file)s", 1); ' % { 'file':file }

    if (not options.js_exps) and (not options.js_files):
        options.js_interactive = True

    if options.js_interactive:
        cmd += 'Narcissus.interpreter.repl();'

    Popen([js_cmd, '-f', narc_jsdefs, '-f', narc_jslex, '-f', narc_jsparse, '-f', narc_jsssa, '-f', narc_jsdecomp, '-f', narc_jsexec, '-e', cmd]).wait()


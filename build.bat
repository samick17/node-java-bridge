@echo off

javac -source 1.7 -target 1.7 -cp . com/samick/jarbridge/*.java
jar -cvfm JarBridge.jar MANIFEST com/samick/jarbridge/*.class

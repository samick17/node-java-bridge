@echo off

javac -target 1.7 -cp . com/samick/jarbridge/Main.java com/samick/jarbridge/instance/*.java
jar -cvfm Main.jar MANIFEST com/samick/jarbridge/*.class com/samick/jarbridge/instance/*.class

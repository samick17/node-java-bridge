@echo off

javac -cp . com/samick/jarbridge/Main.java com/samick/jarbridge/instance/*.java
jar -cvfm Main.jar MANIFEST com/samick/example/*.class com/samick/jarbridge/instance/*.class

::java -cp . com/samick/jarbridge.Main
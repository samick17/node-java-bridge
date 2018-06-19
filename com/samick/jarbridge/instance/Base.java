package com.samick.jarbridge.instance;

public class Base implements ICallable {

	@Override
	public String call() {
		return "Base";
	}

	@Override
	public String call(String arg1) {
		return "Base" + arg1;
	}

}
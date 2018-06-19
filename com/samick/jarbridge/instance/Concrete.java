package com.samick.jarbridge.instance;

public class Concrete extends Base {

	private String value;

	public Concrete() {
		value = "default";
	}

	public Concrete(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}

	@Override
	public String call() {
		return "Concrete";
	}

	@Override
	public String call(String arg1) {
		return "Concrete" + arg1;
	}

}
package com.example.api;

public class Main {

	public static String Foo() {
		return "Foo!!";
	}

	public static void main(String[] args) {
		for(String arg : args) {
			System.out.println(arg);
		}
		System.out.println(Foo());
	}
}

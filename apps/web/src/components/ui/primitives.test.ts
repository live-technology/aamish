import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Alert, Button, ErrorState, SelectField, TextField } from "./primitives";

describe("design-system accessibility contracts",()=>{
  test("connects field labels, descriptions, and errors",()=>{const html=renderToStaticMarkup(createElement(TextField,{label:"Email",name:"email",description:"Work email",error:"Email is invalid"}));expect(html).toContain('for="email"');expect(html).toContain('id="email"');expect(html).toContain('aria-invalid="true"');expect(html).toContain('aria-describedby="email-description email-error"')});
  test("preserves accessible select labeling",()=>{const html=renderToStaticMarkup(createElement(SelectField,{label:"Location",name:"location"},createElement("option",null,"Office")));expect(html).toContain('for="location"');expect(html).toContain('id="location"')});
  test("announces loading buttons without allowing duplicate actions",()=>{const html=renderToStaticMarkup(createElement(Button,{loading:true},"Save"));expect(html).toContain('aria-busy="true"');expect(html).toContain("disabled")});
  test("uses alert semantics for failures",()=>{expect(renderToStaticMarkup(createElement(Alert,{tone:"danger",title:"Failed"},"Retry"))).toContain('role="alert"');expect(renderToStaticMarkup(createElement(ErrorState,{description:"Unavailable",requestId:"req-1"}))).toContain('role="alert"')});
});
